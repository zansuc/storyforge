"use client";
// StoryForge — main page.
// language: TypeScript (React 19 client, Next App Router)
import { useCallback, useState } from "react";
import { Toaster, toast } from "sonner";
import { useStoryForge } from "@/lib/store";
import { runStoryboard } from "@/lib/workflow";
import { assembleVideo } from "@/lib/ffmpeg";
import { sceneCount } from "@/lib/store";
import { ApiKeyDialog, MaskedApiIndicators } from "@/components/api-key-dialog";
import { SceneList } from "@/components/scene-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Settings2,
  Wand2,
  Play,
  Download,
  Loader2,
  Clapperboard,
} from "lucide-react";
import type { AspectRatio, Duration, GenerationMode, Resolution, VisualStyle, VoiceoverMode } from "@/lib/types";

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
      toast(msg, { duration: 4000 });
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
      toast("Isi Gemini API key dulu di Pengaturan");
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
      status(`✖ ${err instanceof Error ? err.message : "Storyboard gagal"}`);
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
    setAssembly({ ratio: 0.05, message: "Memuat FFmpeg (sekali saja)…", active: true });
    setResultUrl(null);
    try {
      const { blob } = await assembleVideo(
        { clips, voiceover: voiceover ? voiceover.file : null, hasAudio: voiceover !== null || store.voiceoverMode === "ai" },
        (p) => setAssembly({ ...p, active: true }),
      );
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setAssembly({ ratio: 1, message: "Video siap!", active: false });
      toast("Video jadi 🎬");
    } catch (err) {
      setAssembly((a) => ({ ...a, active: false }));
      status(`✖ Assembly: ${err instanceof Error ? err.message : "gagal"}`);
    }
  };

  const busyAny = busyScenes.size > 0 || store.isGeneratingStoryboard || assembly.active;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 min-h-dvh">
      <Toaster richColors position="top-center" />
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Clapperboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">StoryForge</h1>
            <p className="text-xs text-muted-foreground">Cerita → storyboard → video</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MaskedApiIndicators />
          <Button variant="outline" size="sm" onClick={() => setKeysOpen(true)}>
            <Settings2 className="mr-1 h-4 w-4" /> Kunci
          </Button>
        </div>
      </header>

      <main className="space-y-6 pb-16">
        {/* Script input */}
        <Card>
          <CardHeader>
            <CardTitle>1 · Tulis cerita</CardTitle>
            <CardDescription>Ide pendek, 1–3 paragraf. Gemini akan memecah ke scene 10 detik.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={5}
              value={store.script}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => store.setScript(e.target.value)}
              placeholder="Contoh: kucing oranye bernama Toge mencuri sarden dari warung Bu Sari, lalu kejaran epik melewati pasar malam…"
            />
            <Button onClick={storyboard} disabled={store.isGeneratingStoryboard}>
              {store.isGeneratingStoryboard ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-1 h-4 w-4" />
              )}
              {store.isGeneratingStoryboard ? "Membuat storyboard…" : "Buat storyboard"}
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>2 · Atur video</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Durasi</Label>
              <Select
                value={String(store.duration)}
                onValueChange={(v) => store.setDuration(Number(v) as Duration)}
              >
                <SelectTrigger><SelectValue placeholder="Durasi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dtk (3 scene)</SelectItem>
                  <SelectItem value="60">60 dtk (6 scene)</SelectItem>
                  <SelectItem value="90">90 dtk (9 scene)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gaya visual</Label>
              <Select
                value={store.visualStyle}
                onValueChange={(v) => store.setVisualStyle(v as VisualStyle)}
              >
                <SelectTrigger><SelectValue placeholder="Gaya" /></SelectTrigger>
                <SelectContent>
                  {(["Stickman", "Cinematic", "Anime", "Minimalist"] as const).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rasio</Label>
              <Select
                value={store.aspectRatio}
                onValueChange={(v) => store.setAspectRatio(v as AspectRatio)}
              >
                <SelectTrigger><SelectValue placeholder="Rasio" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:16">9:16 vertikal</SelectItem>
                  <SelectItem value="16:9">16:9 lanskap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resolusi</Label>
              <Select
                value={String(store.resolution)}
                onValueChange={(v) => store.setResolution(Number(v) as Resolution)}
              >
                <SelectTrigger><SelectValue placeholder="Resolusi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="720">720p</SelectItem>
                  <SelectItem value="1080">1080p</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Voiceover</Label>
              <Select
                value={store.voiceoverMode}
                onValueChange={(v) => store.setVoiceoverMode(v as VoiceoverMode)}
              >
                <SelectTrigger><SelectValue placeholder="Voiceover" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai">AI (NexaBot)</SelectItem>
                  <SelectItem value="upload">Unggah .mp3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select
                value={store.generationMode}
                onValueChange={(v) => store.setGenerationMode(v as GenerationMode)}
              >
                <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (NexaBot)</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Scene: {sceneCount(store.duration)} · {store.duration} dtk</Label>
              <Slider
                value={[store.duration]}
                min={30}
                max={90}
                step={30}
                onValueChange={([v]) => v && store.setDuration(v as Duration)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Scenes */}
        {store.scenes.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">3 · Scene</h2>
              <span className="text-xs text-muted-foreground">{store.generationStatus ?? ""}</span>
            </div>
            <SceneList
              scenes={store.scenes}
              aspect={store.aspectRatio}
              resolution={store.resolution}
              busyScenes={busyScenes}
              setBusyScene={setBusyScene}
              status={status}
            />
          </div>
        ) : null}

        {/* Assembly */}
        {store.scenes.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>4 · Rakit video</CardTitle>
              <CardDescription>
                Klip digabung + voiceover (jika ada) via FFmpeg di browser — nol upload ke server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assembly.active ? (
                <div className="space-y-2">
                  <Progress value={Math.round(assembly.ratio * 100)} />
                  <p className="text-sm text-muted-foreground">{assembly.message}</p>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={assemble} disabled={busyAny}>
                  {assembly.active ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-1 h-4 w-4" />
                  )}
                  {assembly.active ? "Merakit…" : "Rakit video"}
                </Button>
                {resultUrl ? (
                  <>
                    <Button variant="secondary" asChild>
                      <a href={resultUrl} download="storyforge.mp4">
                        <Download className="mr-1 h-4 w-4" /> Unduh .mp4
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => assemble()}>Rakit ulang</Button>
                  </>
                ) : null}
              </div>
              {resultUrl ? (
                <video src={resultUrl} className="mt-2 w-full max-h-96 rounded-md border" controls />
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </main>

      <ApiKeyDialog open={keysOpen} onOpenChange={setKeysOpen} />
    </div>
  );
}
