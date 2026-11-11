// StoryForge — free storyboard route. Calls Respan gateway gemini-4-carbon:free
// server-side so the Respan key never reaches the browser.
// language: TypeScript (Next App Router route handler, node runtime)
import { NextResponse } from "next/server";
import type { Scene, VisualStyle } from "@/lib/types";
import { VISUAL_STYLES } from "@/lib/visual-styles";
import { chatDetailed as coarenaChat, COARENA_MODEL_CHAIN } from "@/lib/coarena";

interface Body {
  script: string;
  duration: number;
  visualStyle: VisualStyle;
  deliveryStyle?: string;
  deliveryDesc?: string;
  masterPrompt?: string;
  clipDirection?: string;
}

// Rantai model gratis — dicoba berurutan sampai satu berhasil.
// Respan: carbon sering "paused (high demand)"; muse-ember jarang kena gate.
// Ascnd: hanya kimi/argon yang hidup, dan keduanya SELALU balas dalam bentuk SSE
//        (content di delta.content, reasoning di delta.reasoning_content).
const PROVIDER_CHAIN = [
  {
    name: "respan",
    base: "https://api.respan.ai/api/chat/completions",
    keyEnv: "RESPAN_API_KEY",
    models: ["google_gemini_ai/gemini-4-carbon:free", "meta/muse-ember:free"],
    stream: false,
  },
  {
    name: "ascnd",
    base: "https://api.ascnd.my.id/v1/chat/completions",
    keyEnv: "ASCND_API_KEY",
    models: ["kimi-k3-1-pro", "gemini-4-argon"],
    stream: true,
  },
];

function buildPrompt(req: Body): string {
  const sceneCount = Math.max(1, Math.round(req.duration / 10));
  const styleDef = VISUAL_STYLES.find((s) => s.id === req.visualStyle);
  const styleLabel = styleDef?.label ?? req.visualStyle;
  const stylePrompt = styleDef?.prompt ?? "";
  const lines = [
    "You are a storyboard director for an AI video generator.",
    `Visual style: "${styleLabel}".`,
  ];
  if (stylePrompt) lines.push(`Visual style description to honor in every prompt: "${stylePrompt}".`);
  if (req.deliveryStyle)
    lines.push(`Storytelling delivery style: "${req.deliveryStyle}"${req.deliveryDesc ? ` — ${req.deliveryDesc}` : ""}.`);
  if (req.masterPrompt)
    lines.push(`Global visual master prompt to honor in every scene: "${req.masterPrompt}".`);
  if (req.clipDirection) lines.push(`Clip motion direction: "${req.clipDirection}".`);
  lines.push(
    `Split the given story script into exactly ${sceneCount} scenes of 10 seconds each.`,
    "Each scene must produce a detailed English text-to-video prompt (character, setting, action, camera), style-consistent.",
    "Return ONLY a JSON array, no markdown, no commentary:",
    '[{"scene_number":1,"text":"<narration text>","image_prompt":"<detailed visual prompt>"}]',
  );
  return `Original story script:\n"""\n${req.script}\n"""\n\nInstruction:\n${lines.join("\n")}`;
}

/** Parse a JSON array of scenes out of model text (tolerates fences/preamble). */
function extractScenes(text: string): Scene[] {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  let raw: Array<{ scene_number?: number; text?: string; image_prompt?: string }> = [];
  try {
    raw = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s, i) => ({
      scene_number: Number(s?.scene_number ?? i + 1),
      text: String(s?.text ?? "").trim(),
      image_prompt: String(s?.image_prompt ?? "").trim(),
    }))
    .filter((s) => s.image_prompt.length > 0 || s.text.length > 0);
}

export async function POST(request: Request) {
  const keys: Record<string, string | undefined> = {
    respan: process.env.RESPAN_API_KEY,
    ascnd: process.env.ASCND_API_KEY,
  };
  if (!keys.respan && !keys.ascnd && !process.env.COARENA_API_KEY) {
    return NextResponse.json(
      { error: "Server tidak punya kunci model (RESPAN_API_KEY / ASCND_API_KEY)." },
      { status: 500 },
    );
  }
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }
  if (!body?.script?.trim()) {
    return NextResponse.json({ error: "Naskah kosong." }, { status: 400 });
  }

  const prompt = buildPrompt(body);
  const errors: string[] = [];

  // PRIMARY: Coarena free tier — 12 models, $0, no per-IP gate, proper tool/json support.
  const coarenaKey = process.env.COARENA_API_KEY;
  if (coarenaKey) {
    for (const model of COARENA_MODEL_CHAIN) {
      try {
        const res = await coarenaChat(coarenaKey, {
          model,
          messages: [{ role: "user", content: prompt }],
          maxTokens: 4096,
          temperature: 0.9,
        });
        const parsed = extractScenes(res.text);
        if (!parsed.length) {
          errors.push(`coarena/${model} → nol scene`);
          continue;
        }
        return NextResponse.json({
          scenes: parsed,
          model: `coarena/${model}`,
          requestId: res.requestId,
        });
      } catch (err) {
        errors.push(`coarena/${model} → ${err instanceof Error ? err.message : "err"}`);
      }
    }
  }

  for (const provider of PROVIDER_CHAIN) {
    const key = keys[provider.keyEnv === "RESPAN_API_KEY" ? "respan" : "ascnd"];
    if (!key) {
      errors.push(`${provider.name} → kunci tidak terpasang`);
      continue;
    }
    for (const model of provider.models) {
    try {
      const r = await fetch(provider.base, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.9,
          max_tokens: 4096,
          ...(provider.stream ? { stream: true } : {}),
        }),
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        errors.push(`${provider.name}/${model} → HTTP ${r.status}${t ? `: ${t.slice(0, 120)}` : ""}`);
        continue; // coba model berikutnya
      }

      let text = "";
      if (provider.stream) {
        const raw = await r.text();
        for (const line of raw.split("\n")) {
          const s = line.trim();
          if (!s.startsWith("data:")) continue;
          const chunk = s.slice(5).trim();
          if (!chunk || chunk === "[DONE]") continue;
          try {
            const o = JSON.parse(chunk) as {
              choices?: Array<{ delta?: { content?: string | null; reasoning_content?: string | null } }>;
            };
            const d = o?.choices?.[0]?.delta;
            if (d?.content) text += d.content;
            else if (d?.reasoning_content) text += d.reasoning_content; // fallback: reasoning-only model
          } catch {
            /* skip malformed chunk */
          }
        }
        text = text.trim();
      } else {
        const j = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
        text = (j?.choices?.[0]?.message?.content ?? "").trim();
      }
      if (!text) {
        errors.push(`${provider.name}/${model} → kosong`);
        continue;
      }

      // strip fences, slice to the JSON array
      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "").trim();
      const start = cleaned.indexOf("[");
      const end = cleaned.lastIndexOf("]");
      if (start === -1 || end === -1) {
        errors.push(`${model} → bukan array JSON`);
        continue;
      }

      const raw = JSON.parse(cleaned.slice(start, end + 1)) as Array<{
        scene_number?: number;
        text?: string;
        image_prompt?: string;
      }>;

      const scenes: Scene[] = raw
        .map((s, i) => ({
          scene_number: Number(s.scene_number ?? i + 1),
          text: (s.text ?? "").trim() || `Scene ${i + 1}`,
          image_prompt: (s.image_prompt ?? "").trim(),
        }))
        .filter((s) => s.image_prompt.length > 0 || s.text.length > 0);

      if (scenes.length === 0) {
        errors.push(`${model} → nol scene`);
        continue;
      }
      return NextResponse.json({ scenes, model });
    } catch (err) {
      errors.push(`${provider.name}/${model} → ${err instanceof Error ? err.message : "err"}`);
    }
    }
  }

  return NextResponse.json(
    { error: `Semua model gratis gagal: ${errors.join(" | ")}` },
    { status: 502 },
  );
}
