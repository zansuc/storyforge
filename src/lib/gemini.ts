// StoryForge — Gemini API client (browser-side, key held in localStorage).
// Real calls against generativelanguage.googleapis.com v1beta.
// language: TypeScript, runtime: browser (fetch)
import type { Scene, VisualStyle } from "@/lib/types";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Probe the key against Google. Returns true if Google accepts it. */
export async function validateGeminiKey(key: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const r = await fetch(`${BASE}/models?pageSize=1&key=${encodeURIComponent(key)}`);
    if (r.ok) {
      const j = await r.json().catch(() => ({}));
      return { ok: true, message: (j as { models?: unknown[] })?.models ? undefined : "Key diterima" };
    }
    const j = await r.json().catch(() => ({}));
    const m = (j as { error?: { message?: string } })?.error?.message ?? `HTTP ${r.status}`;
    return { ok: false, message: m };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "network error" };
  }
}

interface StoryboardRequest {
  script: string;
  duration: number; // total seconds
  visualStyle: VisualStyle;
  deliveryStyle?: string; // gaya penyampaian (komedi/sejarah/edukatif)
  deliveryDesc?: string;
  masterPrompt?: string;
  clipDirection?: string;
}

/**
 * Ask Gemini to split the script into 10-second scenes and return a JSON array.
 * The system instruction pins the schema so we can parse reliably; responseMimeType
 * json keeps the model honest (accepted by flash / 2.5+ models).
 */
export async function generateStoryboard(
  apiKey: string,
  req: StoryboardRequest,
  model = "gemini-2.5-flash",
): Promise<Scene[]> {
  const sceneCount = Math.max(1, Math.round(req.duration / 10));
  const lines = [
    "You are a storyboard director for an AI video generator.",
    `Visual style is "${req.visualStyle}".`,
  ];
  if (req.deliveryStyle) {
    lines.push(`Storytelling delivery style: "${req.deliveryStyle}"${req.deliveryDesc ? ` — ${req.deliveryDesc}` : ""}.`);
  }
  if (req.masterPrompt) {
    lines.push(`Global visual master prompt to honor in every scene: "${req.masterPrompt}".`);
  }
  if (req.clipDirection) {
    lines.push(`Clip motion direction: "${req.clipDirection}".`);
  }
  lines.push(
    `Split the given story script into exactly ${sceneCount} scenes of 10 seconds each.`,
    "Each scene must produce a detailed English text-to-video prompt (character, setting, action, camera), style-consistent.",
    "Return ONLY a JSON array, no markdown, no commentary:",
    '[{"scene_number":1,"text":"<narration text>","image_prompt":"<detailed visual prompt>"}]',
  );
  const system = lines.join("\n");

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `Original story script:\n"""\n${req.script}\n"""\n\nInstruction:\n${system}` }],
      },
    ],
    generationConfig: {
      temperature: 0.9,
      responseMimeType: "application/json",
    },
  };

  const r = await fetch(`${BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    const m = (j as { error?: { message?: string } })?.error?.message ?? `HTTP ${r.status}`;
    throw new Error(m);
  }

  const j = (await r.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = (j?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  if (!text.trim()) throw new Error("Gemini mengembalikan respons kosong.");

  // Gemini may wrap the JSON in ```json fences — strip them.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/g, "")
    .trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("Respons Gemini bukan array JSON yang valid.");
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

  if (scenes.length === 0) throw new Error("Gemini menghasilkan nol scene.");
  return scenes;
}
