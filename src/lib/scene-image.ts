// Client-side sequential image loader for scene previews.
// Pollinations free tier is 1 image / 45s per IP. Firing scene thumbnails in parallel hits
// 429 (FREE_LIMIT) and shows the error placeholder. This module funnels every request through
// one serial queue, honors Retry-After, caches the resulting blob URL, and retries with backoff.
// language: TypeScript (browser)
"use client";

type Job = () => Promise<void>;

const queue: Job[] = [];
let running = false;
const blobCache = new Map<string, string>(); // key -> object URL
const inflight = new Map<string, Promise<string>>();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function drain() {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue.shift()!;
    try {
      await job();
    } catch {
      /* job handles its own errors */
    }
    // Space requests out even on success — the upstream limit is per-IP per-45s.
    if (queue.length) await sleep(46_000);
  }
  running = false;
}

function makeKey(p: string, w: number, h: number, seed: number) {
  return `${seed}|${w}x${h}|${p}`;
}

/**
 * Resolve a scene image to a blob URL, queued and rate-limit aware.
 * Returns the same Promise for identical requests so React re-renders don't refetch.
 */
export function loadSceneImage(prompt: string, w: number, h: number, seed: number): Promise<string> {
  const k = makeKey(prompt, w, h, seed);
  const cached = blobCache.get(k);
  if (cached) return Promise.resolve(cached);
  const existing = inflight.get(k);
  if (existing) return existing;

  const p = new Promise<string>((resolve, reject) => {
    queue.push(async () => {
      const url = `/api/image?p=${encodeURIComponent(prompt.slice(0, 480))}&w=${w}&h=${h}&seed=${seed}`;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const r = await fetch(url, { cache: "force-cache" });
          if (r.ok) {
            const blob = await r.blob();
            const objUrl = URL.createObjectURL(blob);
            blobCache.set(k, objUrl);
            resolve(objUrl);
            return;
          }
          if (r.status === 429) {
            const ra = Number(r.headers.get("Retry-After")) || 20;
            await sleep((ra + 2) * 1000);
            continue;
          }
          // other error → give up
          break;
        } catch {
          await sleep(3000 * (attempt + 1));
        }
      }
      reject(new Error("image_failed"));
    });
    drain();
  });

  inflight.set(k, p);
  p.finally(() => inflight.delete(k)).catch(() => undefined);
  return p;
}
