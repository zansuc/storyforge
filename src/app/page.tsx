"use client";
// StoryForge — main page. Workbench layout: config rail (left) + canvas stage (right).
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
import { Loader2 } from "lucide-react";

const DLV_NAME = {
  komedi: "Santai & Komedi",
  sejarah: "Storytelling Sejarah",
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
    if (!store.script.trim()) {
      toast("Tulis cerita dulu");
      return;
    }
    store.setIsGeneratingStoryboard(true);
    store.setScenes([]);
    setResultUrl(null);
    try {
      // Mode gratis dulu (route server); Gemini key hanya fallback opsional.
      const scenes = await runStoryboard(
        store.geminiApiKey ?? "",
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
          style: { background: "#1c1b19", border: "none", color: "#fdfcf8", fontSize: "13px", borderRadius: "4px" },
        }}
      />

      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="display text-lg font-bold tracking-tight">StoryForge</div>
          <div className="flex items-center gap-4">
            <MaskedApiIndicators />
            <button onClick={() => setKeysOpen(true)} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              API key
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <div className="mb-10 max-w-2xl">
          <h1 className="display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">
            Ubah ide jadi video, 10 detik per scene.
          </h1>
          <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">
            Tulis topik. StoryForge menyusun storyboard per 10 detik, membuat klip dan voice over, lalu menggabungkannya jadi satu video siap unggah.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <WizardPanel onGenerateStoryboard={storyboard} onOpenKeys={() => setKeysOpen(true)} />
          </div>

          <section>
            {!hasScenes ? (
              <div className="rounded-lg border border-dashed border-border p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Pengaturan di kiri menentukan hasil di sini. Klik{" "}
                  <span className="font-medium text-foreground">Generate storyboard</span> untuk mulai.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                  <h2 className="display text-xl font-bold tracking-tight">Storyboard</h2>
                  <span className="text-sm text-muted-foreground">
                    {store.scenes.length} scene · {store.duration} detik
                  </span>
                </div>

                <SceneList
                  scenes={store.scenes}
                  aspect={store.aspectRatio}
                  resolution={store.resolution}
                  busyScenes={busyScenes}
                  setBusyScene={setBusyScene}
                  status={status}
                />

                <section className="border-t border-border pt-6">
                  {assembly.active ? (
                    <div className="mb-4 space-y-2">
                      <Progress value={Math.round(assembly.ratio * 100)} className="h-1" />
                      <p className="text-sm text-muted-foreground">{assembly.message}</p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={assemble}
                      disabled={busyAny || !hasScenes}
                      className="h-10 bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      {assembly.active ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Proses jadi satu video
                    </Button>
                    {resultUrl ? (
                      <Button asChild variant="outline" className="h-10 border-border bg-transparent text-sm hover:bg-secondary">
                        <a href={resultUrl} download="storyforge.mp4">
                          Unduh .mp4
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  {resultUrl ? (
                    <video src={resultUrl} className="mt-6 w-full max-w-2xl rounded-md border border-border" controls />
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
