// StoryForge — orchestration. Ties store, Gemini, NexaBot, and FFmpeg together.
// language: TypeScript, runtime: browser
import type { AspectRatio, Resolution, Scene, VisualStyle } from "@/lib/types";
import { generateStoryboard } from "@/lib/gemini";
import {
  createNexabotJob,
  downloadNexabotJob,
  getNexabotJob,
  nexabotRatio,
  nexabotResolution,
} from "@/lib/nexabot";

export type StatusFn = (msg: string) => void;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Generator of storyboard (with live status + scene count). */
export async function runStoryboard(
  apiKey: string,
  script: string,
  durationSec: number,
  visualStyle: VisualStyle,
  status: StatusFn,
  extras?: { deliveryStyle?: string; deliveryDesc?: string; masterPrompt?: string; clipDirection?: string },
): Promise<Scene[]> {
  status("Meminta storyboard ke Gemini…");
  const scenes = await generateStoryboard(apiKey, {
    script,
    duration: durationSec,
    visualStyle,
    deliveryStyle: extras?.deliveryStyle,
    deliveryDesc: extras?.deliveryDesc,
    masterPrompt: extras?.masterPrompt,
    clipDirection: extras?.clipDirection,
  });
  status(`${scenes.length} scene dibuat.`);
  return scenes;
}

/**
 * Auto mode — generate one clip per scene via NexaBot:
 * create job → poll until done (or fail/expire) → download → Blob.
 * Returns a File for the scene.
 */
export async function generateSceneClip(
  apiKey: string,
  scene: Scene,
  aspect: AspectRatio,
  resolution: Resolution,
  status: StatusFn,
): Promise<File> {
  const job = await createNexabotJob(apiKey, {
    mode: "omni",
    prompt: scene.image_prompt || scene.text,
    ratio: nexabotRatio(aspect),
    resolution: nexabotResolution(resolution),
  });
  const id = job.job_id!;
  status(`Scene ${scene.scene_number}: job ${id.slice(0, 8)}…`);

  const t0 = Date.now();
  let lastStatus = "";
  for (;;) {
    const el = Date.now() - t0;
    const poll = el < 30000 ? 4000 : el < 120000 ? 6000 : 9000;
    await sleep(poll);
    if (Date.now() - t0 > 12 * 60_000) throw new Error(`Waktu habis untuk scene ${scene.scene_number} (12 menit).`);
    const s = await getNexabotJob(apiKey, id);
    const st = s.job?.status ?? "unknown";
    if (st !== lastStatus) {
      lastStatus = st;
      status(`Scene ${scene.scene_number}: ${st} (${Math.round((Date.now() - t0) / 1000)} dtk)`);
    }
    if (st === "done") break;
    if (st === "failed") throw new Error(s.job?.error ?? `Scene ${scene.scene_number} gagal di NexaBot`);
  }
  status(`Scene ${scene.scene_number}: mengunduh…`);
  const blob = await downloadNexabotJob(apiKey, id);
  if (!blob.size) throw new Error(`Unduhan scene ${scene.scene_number} kosong.`);
  return new File([blob], `scene${scene.scene_number}-nexabot.mp4`, { type: "video/mp4" });
}

/**
 * Auto voiceover via NexaBot TTS. Returns a WAV File, or null if no text.
 */
export async function generateVoiceover(
  apiKey: string,
  scenes: Scene[],
  voice: string,
  status: StatusFn,
): Promise<File | null> {
  const text = scenes.map((s) => s.text.trim()).filter(Boolean).join("\n\n");
  if (!text) return null;
  const job = await createNexabotJob(apiKey, { mode: "tts", prompt: text, voice });
  const id = job.job_id!;
  const t0 = Date.now();
  let lastStatus = "";
  for (;;) {
    const el = Date.now() - t0;
    await sleep(el < 30000 ? 4000 : 6000);
    if (Date.now() - t0 > 12 * 60_000) throw new Error("Waktu habis untuk voiceover (12 menit).");
    const s = await getNexabotJob(apiKey, id);
    const st = s.job?.status ?? "unknown";
    if (st !== lastStatus) {
      lastStatus = st;
      status(`Voiceover: ${st}`);
    }
    if (st === "done") break;
    if (st === "failed") throw new Error(s.job?.error ?? "Voiceover gagal di NexaBot");
  }
  status("Voiceover: mengunduh…");
  const blob = await downloadNexabotJob(apiKey, id);
  return new File([blob], "vo-nexabot.wav", { type: "audio/wav" });
}
