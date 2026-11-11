"use client";
// StoryForge — main page. Tokogame-style: hero + wizard 5 langkah (kiri) + studio 4 tahap (kanan).
// language: TypeScript (React 19 client, Next App Router)
import { useCallback, useState } from "react";
import { Toaster, toast } from "sonner";
import { useStoryForge } from "@/lib/store";
import { runStoryboard } from "@/lib/workflow";
import { assembleVideo } from "@/lib/ffmpeg";
import { ApiKeyDialog, MaskedApiIndicators } from "@/components/api-key-dialog";
import { SceneList } from "@/components/scene-list";
import { WizardPanel } from "@/components/wizard-panel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, RefreshCw, MonitorPlay } from "lucide-react";

const DLV_NAME = {
  komedi: "Santai & Komedi (mirip Sam O'Nella / Kok Bisa)",
  sejarah: "Storytelling Sejarah (mirip Oversimplified)",
  edukatif: "Edukatif & To-The-Point",
} as const;
const DLV_DESC = {
  komedi: "Bahasa gaul, analogi kocak, ekspresi lebay",
  sejarah: "Dramatis, humor sarkas, alur kronologis",
  edukatif: "Penjelasan fakta yang jernih, cepat, mudah dipahami",
} as const;

export default function Home() {
  const store = useStoryForge();
  const [keysOpen, setKeysOpen] = useState(false);
  const [busyScenes, setBusyScenes] = useState<Set<number>>(new Set());
  const [assembly, setAssembly] = useState<{ ratio: number; message: string; active: boolean }>({
    ratio: 0,
    message: "",
    active: false,
  });
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const status = useCallback(
    (msg: string) => {
      store.setGenerationStatus(msg);
      toast(msg, { duration: 3500 });
    },
    [store],
  );

  const setBusyScene = useCallback((n: number, busy: boolean) => {
    setBusyScenes((prev) => {
      const next = new Set(prev);
      if (busy) next.add(n);
      else next.delete(n);
      return next;
    });
  }, []);

  const storyboard = async () => {
    if (!store.geminiApiKey) {
      toast("Isi Gemini API key dulu");
      setKeysOpen(true);
      return;
    }
    if (!store.script.trim()) {
      toast("Tulis cerita dulu");
      return;
    }
    store.setIsGeneratingStoryboard(true);
    store.setScenes([]);
    setResultUrl(null);
    try {
      const scenes = await runStoryboard(
        store.geminiApiKey,
        store.script,
        store.duration,
        store.visualStyle,
        status,
        {
          deliveryStyle: DLV_NAME[store.deliveryStyle],
          deliveryDesc: DLV_DESC[store.deliveryStyle],
          masterPrompt: store.masterPrompt,
          clipDirection: store.clipDirection,
        },
      );
      store.setScenes(scenes);
    } catch (err) {
      status(err instanceof Error ? err.message : "Storyboard gagal");
    } finally {
      store.setIsGeneratingStoryboard(false);
    }
  };

  const assemble = async () => {
    const scenes = store.scenes;
    if (scenes.length === 0) return;
    const clips: Blob[] = [];
    for (const s of scenes) {
      const asset = store.assets[s.scene_number];
      if (!asset) {
        toast(`Scene ${s.scene_number} belum punya klip`);
        return;
      }
      clips.push(asset.file);
    }
    const voiceover = store.voiceover;
    setAssembly({ ratio: 0.05, message: "Memuat FFmpeg…", active: true });
    setResultUrl(null);
    try {
      const { blob } = await assembleVideo(
        { clips, voiceover: voiceover ? voiceover.file : null, hasAudio: voiceover !== null || store.voiceoverMode === "ai" },
        (p) => setAssembly({ ...p, active: true }),
      );
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setAssembly({ ratio: 1, message: "Video siap", active: false });
      toast("Video jadi");
    } catch (err) {
      setAssembly((a) => ({ ...a, active: false }));
      status(`Assembly: ${err instanceof Error ? err.message : "gagal"}`);
    }
  };

  const busyAny = busyScenes.size > 0 || store.isGeneratingStoryboard || assembly.active;
  const hasScenes = store.scenes.length > 0;

  return (
    <div className="min-h-dvh bg-background">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#ffffff", border: "1px solid #e8e4db", color: "#1a1a2e", fontSize: "13px" },
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="gradient-bg flex h-8 w-8 items-center justify-center rounded-lg">
              <MonitorPlay className="h-4 w-4 text-white" />
            </div>
            <span className="font-mono text-base font-bold tracking-tight">StoryForge</span>
          </div>
          <div className="flex items-center gap-3">
            <MaskedApiIndicators />
            <Button
              onClick={() => setKeysOpen(true)}
              variant="outline"
              className="h-9 border-border bg-white font-mono text-[13px] hover:bg-secondary"
            >
              API Key
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {/* Hero */}
        <section className="py-10 text-center sm:py-14">
          <div className="mono-label">Studio video cerita</div>
          <h1 className="mx-auto mt-3 max-w-[18ch] font-mono text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            Ubah ide jadi <span className="gradient-text">video</span> cuma dalam beberapa klik
          </h1>
          <p className="mx-auto mt-4 max-w-[55ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tulis topik, biarkan AI menyusun storyboard per 10 detik, upload klip dan suara, lalu gabungkan semuanya jadi satu video.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {["Gemini", "NexaBot", "Omni Flash", "Bang Story"].map((p) => (
              <span key={p} className="rounded-full border border-border bg-white px-3 py-1 font-mono text-[11px] text-muted-foreground">
                {p}
              </span>
            ))}
          </div>
        </section>

        {/* Wizard: kiri + studio kanan */}
        <div className="grid gap-8 lg:grid-cols-[minmax(380px,42%)_1fr]">
          <WizardPanel onGenerateStoryboard={storyboard} onOpenKeys={() => setKeysOpen(true)} />

          {/* Kanan — studio */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-5 border-b border-border pb-3">
              {["Storyboard", "Voice over", "Klip scene", "Gabung video"].map((stage, i) => (
                <div key={stage} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white font-mono text-[10px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className={`text-xs ${stage === "Storyboard" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {stage}
                  </span>
                </div>
              ))}
            </div>

            {!hasScenes ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/50 p-10 text-center">
                <div className="mono-label mb-3">Mode Otomatis</div>
                <p className="max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
                  Lengkapi pengaturan di sebelah kiri, lalu klik{" "}
                  <span className="font-semibold text-foreground">Generate Storyboard</span>. Storyboard, klip, dan voice over
                  akan diproses di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-mono text-xl font-bold tracking-tight">Storyboard</h2>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {store.scenes.length} scene · {store.duration}s
                    </p>
                  </div>
                  {store.generationStatus ? <span className="mono-label text-right">{store.generationStatus}</span> : null}
                </div>

                <SceneList
                  scenes={store.scenes}
                  aspect={store.aspectRatio}
                  resolution={store.resolution}
                  busyScenes={busyScenes}
                  setBusyScene={setBusyScene}
                  status={status}
                />

                <section className="rounded-2xl border border-border bg-white p-5">
                  {assembly.active ? (
                    <div className="mb-4 space-y-2">
                      <Progress value={Math.round(assembly.ratio * 100)} className="h-1" />
                      <p className="mono-label">{assembly.message}</p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={assemble}
                      disabled={busyAny || !hasScenes}
                      className="h-11 bg-[#ff6f86] px-6 font-mono text-[13px] font-medium text-white shadow-sm hover:bg-[#f25e76]"
                    >
                      {assembly.active ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                      {assembly.active ? "Merakit…" : "Proses jadi 1 video"}
                    </Button>
                    {resultUrl ? (
                      <Button asChild className="h-11 bg-[#1a1a2e] px-6 font-mono text-[13px] font-medium text-white hover:bg-[#2a2a44]">
                        <a href={resultUrl} download="storyforge.mp4">
                          <Download className="mr-1.5 h-4 w-4" /> Unduh .mp4
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  {resultUrl ? (
                    <video src={resultUrl} className="mt-5 w-full max-w-2xl rounded-xl border border-border" controls />
                  ) : null}
                </section>
              </div>
            )}
          </section>
        </div>
      </main>

      <ApiKeyDialog open={keysOpen} onOpenChange={setKeysOpen} />
    </div>
  );
}
