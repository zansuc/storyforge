// StoryForge — shared NexaBot upstream fetch helper (server-side only).
// language: TypeScript (Next 16 route handler, server)
const NX_BASE = "https://nexabot.id/nx/api/v1";
const RETRY = new Set([429, 502, 503, 504]);

export async function nxFetch(path: string, init?: RequestInit, tries = 3): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const r = await fetch(`${NX_BASE}${path}`, init);
      if (!RETRY.has(r.status) || attempt >= tries - 1) return r;
    } catch (e) {
      lastErr = e;
      if (attempt >= tries - 1) throw e;
    }
    await new Promise((res) => setTimeout(res, 1000 * (attempt + 1) + Math.random() * 500));
  }
  throw lastErr;
}

export function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function readJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export const requireKey = (req: Request): string | null => {
  const key = req.headers.get("x-api-key") ?? "";
  return key ? key : null;
};
