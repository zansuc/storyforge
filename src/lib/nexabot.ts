// StoryForge — NexaBot API client.
// NexaBot uses an async-job contract: create → poll → download.
// Browser calls our Next.js route handlers (src/app/api/nexabot), which forward
// to NexaBot server-side to avoid CORS; the x-api-key is forwarded header-only.
// language: TypeScript, runtime: browser (fetch → /api/nexabot/*)
import type { AspectRatio, Resolution } from "@/lib/types";

export interface NexabotJobResponse {
  job_id?: string;
  credit_cost?: number;
  error?: string;
}

export interface NexabotJobStatus {
  job?: { status?: "queued" | "processing" | "done" | "failed"; error?: string };
}

/** Validate the NexaBot key via the same job/cek-key lane the reference uses. */
export async function validateNexabotKey(key: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const r = await fetch("/api/nexabot/cek-key", {
      headers: { "x-api-key": key },
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (r.status === 401 || r.status === 403 || r.status === 402) return { ok: false, message: j.error ?? `HTTP ${r.status}` };
    if (r.status === 404 || r.ok) return { ok: true, message: j.error };
    return { ok: false, message: `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "network error" };
  }
}

/** Create a generation job. mode: 'omni' (video from prompt) or 'tts' (voiceover). */
export async function createNexabotJob(
  key: string,
  body: {
    mode: "omni" | "tts";
    prompt: string;
    ratio?: number; // NexaBot convention from reference: 2 = 9:16, 1 = 16:9
    resolution?: number;
    voice?: string;
  },
): Promise<NexabotJobResponse> {
  const r = await fetch("/api/nexabot/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify(body),
  });
  const j = (await r.json().catch(() => ({}))) as NexabotJobResponse;
  if (!r.ok || !j.job_id) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j;
}

/** Poll job status. */
export async function getNexabotJob(key: string, id: string): Promise<NexabotJobStatus> {
  const r = await fetch(`/api/nexabot/jobs/${id}`, { headers: { "x-api-key": key } });
  const j = (await r.json().catch(() => ({}))) as NexabotJobStatus;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return j;
}

/** Download finished artifact as a Blob. */
export async function downloadNexabotJob(key: string, id: string): Promise<Blob> {
  const r = await fetch(`/api/nexabot/jobs/${id}/download`, { headers: { "x-api-key": key } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.blob();
}

/** Map the app's AspectRatio to the NexaBot ratio integer the reference uses. */
export const nexabotRatio = (aspect: AspectRatio): number => (aspect === "9:16" ? 2 : 1);

/** The reference uses 720 unless the user picked >=1080. */
export const nexabotResolution = (res: Resolution): number => (res >= 1080 ? 1080 : 720);
