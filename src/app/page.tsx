"use client";
// StoryForge — main page. Two-pane asymmetric split (sticky config + scrolling stage).
// language: TypeScript (React 19 client, Next App Router)
import { useCallback, useState } from "react";
import { Toaster, toast } from "sonner";
import { useStoryForge } from "@/lib/store";
import { runStoryboard } from "@/lib/workflow";
import { assembleVideo } from "@/lib/ffmpeg";
import { ApiKeyDialog, MaskedApiIndicators } from "@/components/api-key-dialog";
import { SceneList } from "@/components/scene-list";
import { SettingsPanel } from "@/components/settings-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Download, Loader2, RefreshCw } from "lucide-react";

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
    <div className="grain min-h-dvh lg:grid lg:grid-cols-[minmax(340px,38%)_1fr]">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#141416",
            border: "1px solid #26262a",
            color: "#f5f5f4",
            fontFamily: "var(--font-geist-mono)",
            fontSize: "13px",
          },
        }}
      />

      {/* Left pane — sticky config */}
      <aside className="border-border lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-r">
        <div className="flex h-full flex-col gap-8 p-6 lg:p-8">
          <header className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg font-semibold tracking-tight">StoryForge</span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <button onClick={() => setKeysOpen(true)} className="mono-label hover:text-foreground transition-colors">
              Kunci
            </button>
          </header>

          <div className="space-y-2">
            <span className="mono-label">Naskah</span>
            <Textarea
              rows={8}
              value={store.script}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => store.setScript(e.target.value)}
              placeholder="Ceritakan idemu. Satu paragraf cukup. Gemini memecahnya jadi scene 10 detik."
              className="resize-none border-border bg-secondary/40 font-mono text-[13px] leading-relaxed placeholder:text-muted-foreground/60 focus-visible:ring-primary/40"
            />
          </div>

          <SettingsPanel />

          <div className="mt-auto space-y-3 pt-4">
            <MaskedApiIndicators />
            <Button
              onClick={storyboard}
              disabled={store.isGeneratingStoryboard}
              className="h-11 w-full bg-primary font-mono text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              {store.isGeneratingStoryboard ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              {store.isGeneratingStoryboard ? "Menyusun storyboard" : "Buat storyboard"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Right pane — scrolling stage */}
      <main className="min-w-0 p-6 lg:p-10">
        {!hasScenes ? (
          <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="mono-label mb-3">StoryForge</div>
            <h1 className="max-w-[22ch] font-mono text-2xl font-medium tracking-tight text-foreground/90 md:text-3xl">
              Cerita jadi storyboard. Storyboard jadi video.
            </h1>
            <p className="mt-4 max-w-[45ch] text-sm leading-relaxed text-muted-foreground">
              Tulis naskah di kiri, atur gaya dan durasi, lalu biarkan Gemini merancang tiap scene 10 detik.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-mono text-xl font-medium tracking-tight">Storyboard</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {store.scenes.length} scene · {store.duration}s
                </p>
              </div>
              {store.generationStatus ? (
                <span className="mono-label text-right">{store.generationStatus}</span>
              ) : null}
            </div>

            <SceneList
              scenes={store.scenes}
              aspect={store.aspectRatio}
              resolution={store.resolution}
              busyScenes={busyScenes}
              setBusyScene={setBusyScene}
              status={status}
            />

            {/* Assembly */}
            <section className="border-t border-border pt-8">
              {assembly.active ? (
                <div className="mb-4 space-y-2">
                  <Progress value={Math.round(assembly.ratio * 100)} className="h-1" />
                  <p className="mono-label">{assembly.message}</p>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={assemble}
                  disabled={busyAny}
                  variant="outline"
                  className="h-10 border-border bg-transparent font-mono text-[13px] hover:bg-secondary"
                >
                  {assembly.active ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1.5 h-4 w-4" />
                  )}
                  Rakit video
                </Button>
                {resultUrl ? (
                  <Button
                    asChild
                    className="h-10 bg-primary font-mono text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <a href={resultUrl} download="storyforge.mp4">
                      <Download className="mr-1.5 h-4 w-4" /> Unduh .mp4
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
      </main>

      <ApiKeyDialog open={keysOpen} onOpenChange={setKeysOpen} />
    </div>
  );
}
