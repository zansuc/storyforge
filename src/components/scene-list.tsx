"use client";
// StoryForge — scene list. Per scene: auto-generate via NexaBot, or manual upload.
// language: TypeScript (React 19 client)
import { useRef } from "react";
import { useStoryForge } from "@/lib/store";
import { generateSceneClip } from "@/lib/workflow";
import type { Scene } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Film, Loader2, Upload, Sparkles, Volume2 } from "lucide-react";

interface Props {
  aspect: "9:16" | "16:9";
  resolution: 720 | 1080;
  busyScenes: Set<number>;
  setBusyScene: (n: number, busy: boolean) => void;
  status: (msg: string) => void;
}

function SceneRow({
  scene,
  aspect,
  resolution,
  busy,
  setBusyScene,
  status,
}: Omit<Props, "busyScenes"> & { scene: Scene; busy: boolean }) {
  const asset = useStoryForge((s) => s.assets[scene.scene_number]);
  const setAsset = useStoryForge((s) => s.setAsset);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAsset(scene.scene_number, {
      sceneNumber: scene.scene_number,
      file: f,
      url: URL.createObjectURL(f),
      source: "upload",
    });
  };

  const handleAuto = async () => {
    setBusyScene(scene.scene_number, true);
    try {
      const file = await generateSceneClip(
        useStoryForge.getState().nexabotApiKey,
        scene,
        aspect,
        resolution,
        status,
      );
      setAsset(scene.scene_number, {
        sceneNumber: scene.scene_number,
        file,
        url: URL.createObjectURL(file),
        source: "nexabot",
      });
    } catch (err) {
      status(`✖ Scene ${scene.scene_number}: ${err instanceof Error ? err.message : "gagal"}`);
    } finally {
      setBusyScene(scene.scene_number, false);
    }
  };

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {scene.scene_number}
            </span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">10 dtk</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <Upload className="mr-1 h-3 w-3" /> Unggah
            </Button>
            <Button variant="outline" size="sm" onClick={handleAuto} disabled={busy || !useStoryForge.getState().nexabotApiKey}>
              {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              NexaBot
            </Button>
            <Input ref={fileInput} type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleUpload} />
          </div>
        </div>
        <p className="text-sm text-foreground/90">{scene.text}</p>
        {scene.image_prompt ? (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none">Prompt visual</summary>
            <p className="mt-1 whitespace-pre-wrap font-mono">{scene.image_prompt}</p>
          </details>
        ) : null}
        {asset ? (
          <div className="space-y-1">
            <video src={asset.url} className="w-full rounded-md border" controls muted />
            <p className="text-xs text-muted-foreground">
              <Film className="mr-1 inline h-3 w-3" />
              {asset.file.name} · {asset.source === "nexabot" ? "NexaBot" : "unggahan"} · {(asset.file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function SceneList({ scenes, aspect, resolution, busyScenes, setBusyScene, status }: Props & { scenes: Scene[] }) {
  const voiceover = useStoryForge((s) => s.voiceover);
  const voInput = useRef<HTMLInputElement>(null);
  const setVoiceover = useStoryForge((s) => s.setVoiceover);

  const handleVOUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setVoiceover({
      sceneNumber: -1,
      file: f,
      url: URL.createObjectURL(f),
      source: "upload",
    });
  };

  return (
    <div className="space-y-3">
      {scenes.map((s) => (
        <SceneRow
          key={s.scene_number}
          scene={s}
          aspect={aspect}
          resolution={resolution}
          busy={busyScenes.has(s.scene_number)}
          setBusyScene={setBusyScene}
          status={status}
        />
      ))}
      {scenes.length > 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Volume2 className="h-4 w-4" />
              {voiceover ? (
                <span className="text-foreground/90">
                  Voiceover: {voiceover.file.name} · {(voiceover.file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              ) : (
                <span className="text-muted-foreground">Belum ada voiceover (opsional)</span>
              )}
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => voInput.current?.click()}>
                <Upload className="mr-1 h-3 w-3" /> Unggah .mp3
              </Button>
              <Input ref={voInput} type="file" accept="audio/*" className="hidden" onChange={handleVOUpload} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
