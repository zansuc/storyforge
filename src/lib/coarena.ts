// StoryForge — Coarena model client (OpenAI-compatible).
// Coarena is the primary free provider: 12 models, $0 in/out, tools+vision+json_schema,
// no per-IP rate gate. Falls back to Respan (carbon/muse) then Ascnd (SSE) in storyboard route.
// language: TypeScript (server-side only)
const BASE = "https://coarena.ai/api/v1";

export type CoarenaModel = {
  id: string;
  display_name?: string;
  owned_by?: string;
  context_length?: number;
  max_completion_tokens?: number;
  capabilities?: {
    vision?: boolean;
    tools?: boolean;
    json_schema?: boolean;
    reasoning_text?: boolean;
  };
  pricing?: { prompt?: string; completion?: string };
};

/** Live model catalogue — never hardcode the list, Coarena rotates it. */
export async function listModels(apiKey: string): Promise<CoarenaModel[]> {
  const r = await fetch(`${BASE}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`coarena/models HTTP ${r.status}`);
  const j = (await r.json()) as { data?: CoarenaModel[] };
  return j?.data ?? [];
}

type ChatOpts = {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
  jsonSchema?: unknown;
};

type ChatResult = { text: string; requestId: string };

/** Plain chat completion. Returns assistant text plus the Coarena request id
 *  used for /feedback (header form `req_...`; the body `id` is rejected). */
export async function chatDetailed(apiKey: string, opts: ChatOpts): Promise<ChatResult> {
  const payload: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    stream: false,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.9,
  };
  if (opts.jsonSchema) {
    payload.response_format = { type: "json_schema", json_schema: opts.jsonSchema };
  }
  const r = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`coarena/${opts.model} HTTP ${r.status}${t ? `: ${t.slice(0, 160)}` : ""}`);
  }
  const requestId =
    r.headers.get("x-coarena-request-id") ?? r.headers.get("x-request-id") ?? "";
  const j = (await r.json()) as { id?: string; choices?: Array<{ message?: { content?: string | null } }> };
  const text = (j?.choices?.[0]?.message?.content ?? "").trim();
  if (!text) throw new Error(`coarena/${opts.model} → kosong`);
  return { text, requestId: requestId || (j?.id ?? "") };
}

/** Plain chat completion. Returns assistant text ("" if the model emitted none). */
export async function chat(apiKey: string, opts: ChatOpts): Promise<string> {
  const { text } = await chatDetailed(apiKey, opts);
  return text;
}

/** Rate a previous reply: +1 good, -1 bad. Needs the reply's request_id
 *  (the response body `id`, or the `x-coarena-request-id` header). */
export async function feedback(
  apiKey: string,
  requestId: string,
  rating: 1 | -1,
): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/feedback`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: requestId, rating }),
      cache: "no-store",
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Coarena free tier is the default worker: best quality, no rate dance. */
export const COARENA_MODEL_CHAIN = ["kimi-k3-1-pro", "gemini-4-argon", "deepseek-v4-1-flash-1017"];
