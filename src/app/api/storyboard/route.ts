// StoryForge — free storyboard route. Calls Respan gateway gemini-4-carbon:free
// server-side so the Respan key never reaches the browser.
// language: TypeScript (Next App Router route handler, node runtime)
import { NextResponse } from "next/server";
import type { Scene, VisualStyle } from "@/lib/types";
import { VISUAL_STYLES } from "@/lib/visual-styles";

interface Body {
  script: string;
  duration: number;
  visualStyle: VisualStyle;
  deliveryStyle?: string;
  deliveryDesc?: string;
  masterPrompt?: string;
  clipDirection?: string;
}

const MODEL = "google_gemini_ai/gemini-4-carbon:free";

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

export async function POST(request: Request) {
  const key = process.env.RESPAN_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Server tidak punya kunci Respan (RESPAN_API_KEY)." }, { status: 500 });
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

  try {
    const r = await fetch("https://api.respan.ai/api/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: buildPrompt(body) }],
        temperature: 0.9,
        max_tokens: 4096,
      }),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return NextResponse.json({ error: `Respan HTTP ${r.status}${t ? `: ${t.slice(0, 200)}` : ""}` }, { status: 502 });
    }

    const j = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = (j?.choices?.[0]?.message?.content ?? "").trim();
    if (!text) return NextResponse.json({ error: "Respan mengembalikan respons kosong." }, { status: 502 });

    // strip fences, slice to the JSON array
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "").trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start === -1 || end === -1) return NextResponse.json({ error: "Respons bukan array JSON." }, { status: 502 });

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

    if (scenes.length === 0) return NextResponse.json({ error: "Nol scene dihasilkan." }, { status: 502 });
    return NextResponse.json({ scenes, model: MODEL });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "gagal memanggil Respan" },
      { status: 500 },
    );
  }
}
