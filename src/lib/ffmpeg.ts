// StoryForge — client-side video assembly with FFmpeg.wasm.
// Loads the single-thread core (works without SharedArrayBuffer headers) and:
//   1. transcodes each clip to a common codec/params
//   2. concatenates them
//   3. muxes the voiceover audio (if any)
// language: TypeScript, runtime: browser (ffmpeg.wasm 0.12.x)
// The UMD build is injected as a <script> tag at runtime and read off window —
// the bundler never processes the library's internal worker import, so webpack
// stays happy. Example: window.FFmpegWASM.FFmpeg
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Single-thread core — no COOP/COEP headers required on Vercel.
const CORE_VERSION = "0.12.6";
const FFMPEG_VERSION = "0.12.15";
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;
const FFMPEG_UMD = `https://unpkg.com/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/umd/ffmpeg.js`;

type FFmpegLike = {
  on: (event: string, cb: (payload: { message?: string; type?: string }) => void) => void;
  off: (event: string, cb: (payload: { message?: string; type?: string }) => void) => void;
  load: (config: { coreURL: string; wasmURL: string }) => Promise<void>;
  writeFile: (name: string, data: Uint8Array) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array | ArrayBuffer>;
  deleteFile: (name: string) => Promise<void>;
  exec: (args: string[]) => Promise<void>;
};

type FFmpegCtor = new (opts?: { classWorkerURL?: string }) => FFmpegLike;

declare global {
  interface Window {
    FFmpegWASM?: { FFmpeg?: FFmpegCtor };
  }
}

let ffmpeg: FFmpegLike | null = null;
let loadPromise: Promise<FFmpegLike> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`gagal memuat ${src}`));
    document.head.appendChild(s);
  });
}

export interface Progress {
  ratio: number; // 0..1 overall
  message: string;
}

/**
 * Ensure a singleton FFmpeg instance is loaded.
 */
export function loadFFmpeg(onProgress?: (p: Progress) => void): Promise<FFmpegLike> {
  if (ffmpeg) return Promise.resolve(ffmpeg);
  if (!loadPromise) {
    loadPromise = (async () => {
      if (typeof document === "undefined") throw new Error("browser only");
      onProgress?.({ ratio: 0.01, message: "Memuat ffmpeg…" });
      await loadScript(FFMPEG_UMD);
      const Ctor = window.FFmpegWASM?.FFmpeg;
      if (!Ctor) throw new Error("FFmpeg WASM gagal dimuat");
      const inst = new Ctor();
      inst.on("log", (payload) => {
        onProgress?.({ ratio: 0.02, message: payload?.message ?? "" });
      });
      await inst.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      ffmpeg = inst;
      return inst;
    })();
  }
  return loadPromise;
}

function extOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : "mp4";
}

export interface AssembleInput {
  clips: Blob[]; // one per scene, in order
  voiceover: Blob | null;
  hasAudio: boolean; // true if user chose AI voiceover / uploaded one
}

/**
 * Concatenate the clips and (optionally) mux the voiceover.
 * Every clip is transcoded to libx264 + aac so the concat demuxer is safe,
 * even across mixed codecs. Progress streams to onProgress.
 */
export async function assembleVideo(
  input: AssembleInput,
  onProgress?: (p: Progress) => void,
): Promise<{ blob: Blob; ffmpegLog: string[] }> {
  const ff = await loadFFmpeg((p) => onProgress?.({ ratio: 0.05, message: p.message }));
  const logs: string[] = [];
  const onLog = (payload: { message?: string }) => {
    logs.push(payload?.message ?? "");
  };
  const onLogWrapper = (payload: { message?: string; type?: string }) => onLog(payload);
  ff.on("log", onLogWrapper);

  const ext = "mp4";
  const names: string[] = [];

  try {
    // 1. Write every clip. Normalize to libx264+aac, faststart, same fps so concat is clean.
    for (let i = 0; i < input.clips.length; i++) {
      const clip = input.clips[i];
      const inName = `clip_${i}.${extOf(clip instanceof File ? clip.name : "clip")}`;
      const outName = `norm_${i}.${ext}`;
      onProgress?.({ ratio: 0.1 + (0.5 * i) / Math.max(1, input.clips.length), message: `Menyiapkan klip ${i + 1}/${input.clips.length}…` });
      await ff.writeFile(inName, await fetchFile(input.clips[i]));
      // -t 10 keeps each scene at its natural length (the PRD scene is 10s; NexaBot returns ~10s).
      await ff.exec([
        "-i", inName,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-r", "30",
        "-c:a", "aac",
        "-ar", "44100",
        "-ac", "2",
        "-movflags", "+faststart",
        "-y",
        outName,
      ]);
      names.push(outName);
    }

    // 2. concat demuxer
    const list = names.map((n) => `file '${n}'`).join("\n");
    await ff.writeFile("list.txt", new TextEncoder().encode(list));
    onProgress?.({ ratio: 0.65, message: "Menggabungkan klip…" });
    await ff.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "concat.mp4", "-y"]);

    // 3. mux voiceover
    let finalName = "concat.mp4";
    if (input.voiceover) {
      onProgress?.({ ratio: 0.8, message: "Menggabungkan voiceover…" });
      await ff.writeFile("vo_audio", await fetchFile(input.voiceover));
      await ff.exec([
        "-i", "concat.mp4",
        "-i", "vo_audio",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-c:v", "copy",
        "-c:a", "aac",
        "-shortest",
        "-movflags", "+faststart",
        "-y",
        "final.mp4",
      ]);
      finalName = "final.mp4";
    }

    onProgress?.({ ratio: 0.95, message: "Menyiapkan unduhan…" });
    const data = await ff.readFile(finalName);
    const u8 = data instanceof Uint8Array ? data : new Uint8Array(data as unknown as ArrayBuffer);
    const blob = new Blob([u8.buffer as ArrayBuffer], { type: "video/mp4" });

    // cleanup
    for (const n of [...names, "list.txt", "concat.mp4", "final.mp4", "vo_audio", "clip_0"]) {
      try {
        await ff.deleteFile(n);
      } catch {
        /* ignore */
      }
    }
    for (let i = 0; i < input.clips.length; i++) {
      try {
        await ff.deleteFile(`clip_${i}.${ext}`);
      } catch {
        /* ignore */
      }
    }
    onProgress?.({ ratio: 1, message: "Selesai" });
    return { blob, ffmpegLog: logs };
  } finally {
    ff.off("log", onLogWrapper);
  }
}
