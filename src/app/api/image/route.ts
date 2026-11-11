// StoryForge — scene image proxy (single attempt, serverless-safe).
// Pollinations free tier = 1 image / 45s per IP. On 402 FREE_LIMIT we DON'T sleep here
// (Vercel functions are short-lived); we return 429 + Retry-After and let the client queue.
// language: TypeScript (Next App Router route handler, node runtime)
import { NextResponse } from "next/server";

const UPSTREAM = "https://image.pollinations.ai/prompt";

// Small per-instance cache; not relied upon for correctness (client blob-URL cache is primary).
const cache = new Map<string, Buffer>();

function key(prompt: string, w: number, h: number, seed: number) {
  return `${seed}|${w}x${h}|${prompt}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prompt = (searchParams.get("p") || "").slice(0, 480) || "storyboard frame";
  const w = Math.min(Math.max(Number(searchParams.get("w")) || 540, 128), 1280);
  const h = Math.min(Math.max(Number(searchParams.get("h")) || 960, 128), 1280);
  const seed = Number(searchParams.get("seed")) || 1;
  const k = key(prompt, w, h, seed);

  const hit = cache.get(k);
  if (hit) {
    return new NextResponse(new Uint8Array(hit), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=604800, immutable" },
    });
  }

  const url = `${UPSTREAM}/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&seed=${seed}`;
  let r: Response;
  try {
    r = await fetch(url, { cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }

  if (r.ok) {
    const buf = Buffer.from(await r.arrayBuffer());
    if (cache.size > 80) cache.delete(cache.keys().next().value as string);
    cache.set(k, buf);
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=604800, immutable" },
    });
  }

  // 402 FREE_LIMIT → tell the client exactly how long to wait.
  let retryAfter = 20;
  try {
    const j = (await r.json()) as { error?: { message?: string } };
    const m = j?.error?.message?.match(/Retry after (\d+)s/i);
    if (m) retryAfter = Number(m[1]);
  } catch {
    /* ignore */
  }
  return NextResponse.json(
    { error: "free_limit", retryAfter },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export const maxDuration = 30;
