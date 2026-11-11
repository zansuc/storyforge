"use client";
// StoryForge — scene list. Editorial rows with margin numbers, not uniform cards.
// language: TypeScript (React 19 client)
import { useEffect, useRef, useState } from "react";
import { useStoryForge } from "@/lib/store";
import { generateSceneClip } from "@/lib/workflow";
import { loadSceneImage } from "@/lib/scene-image";
import type { Scene } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Volume2, ImagePlus } from "lucide-react";

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
  const [seed, setSeed] = useState<number>(() => (scene.scene_number * 7919 + 13) % 100000);
  const [showImage, setShowImage] = useState(true);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const hasPrompt = Boolean(scene.image_prompt);
  useEffect(() => {
    if (!hasPrompt) {
      setImgLoading(false);
      return;
    }
    let alive = true;
    setImgLoading(true);
    setShowImage(true);
    const [w, h] = aspect === "9:16" ? [540, 960] : [960, 540];
    loadSceneImage(scene.image_prompt as string, w, h, seed)
      .then((url) => {
        if (alive) {
          setImgSrc(url);
          setImgLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setImgLoading(false);
          setShowImage(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [scene.image_prompt, aspect, seed, hasPrompt]);

  const imgUrl = imgSrc;

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
      status(`Scene ${scene.scene_number}: ${err instanceof Error ? err.message : "gagal"}`);
    } finally {
      setBusyScene(scene.scene_number, false);
    }
  };

  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-x-5 gap-y-3 border-t border-border py-6 first:border-t-0 first:pt-4">
      {/* Margin number */}
      <div className="pt-0.5 text-sm tabular-nums text-muted-foreground">
        {String(scene.scene_number).padStart(2, "0")}
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-foreground/95">{scene.text}</p>
          <div className="flex shrink-0 items-center gap-2">
            {imgUrl ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImgLoading(true);
                  setShowImage(true);
                  setSeed(Math.floor(Math.random() * 100000));
                }}
                className="h-8 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <ImagePlus className="mr-1 h-3 w-3" /> Gambar
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInput.current?.click()}
              className="h-8 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Upload className="mr-1 h-3 w-3" /> Unggah
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAuto}
              disabled={busy || !useStoryForge.getState().nexabotApiKey}
              className="h-8 border-border bg-transparent text-xs hover:bg-secondary"
            >
              {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              NexaBot
            </Button>
            <Input ref={fileInput} type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleUpload} />
          </div>
        </div>

        {imgUrl && showImage ? (
          <div className="relative overflow-hidden rounded-sm border border-border bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={imgUrl}
              src={imgUrl}
              alt={`Pratinjau scene ${scene.scene_number}`}
              loading="lazy"
              onLoad={() => setImgLoading(false)}
              onError={() => setShowImage(false)}
              className="block w-full"
              style={{ aspectRatio: aspect === "9:16" ? "9 / 16" : "16 / 9", maxWidth: aspect === "9:16" ? 260 : "100%" }}
            />
            {imgLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary" style={{ maxWidth: aspect === "9:16" ? 260 : "100%" }}>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-[11px]">memproses gambar…</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {scene.image_prompt ? (
          <details className="group text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none text-muted-foreground/80 hover:text-foreground">
              Prompt visual
            </summary>
            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed">{scene.image_prompt}</p>
          </details>
        ) : null}

        {asset ? (
          <div className="space-y-1.5">
            <video src={asset.url} className="max-h-72 w-auto rounded-sm border border-border" controls muted />
            <p className="text-xs text-muted-foreground">
              {asset.file.name} · {asset.source === "nexabot" ? "NexaBot" : "unggahan"} · {(asset.file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        ) : null}
      </div>
    </div>
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
    <div className="space-y-0">
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
        <div className="mt-6 flex items-center justify-between gap-4 border border-dashed border-border p-4">
          <div className="flex items-center gap-2.5 text-sm">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            {voiceover ? (
              <span className="text-[13px] text-foreground/90">
                {voiceover.file.name} · {(voiceover.file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            ) : (
              <span className="text-muted-foreground">Voiceover opsional</span>
            )}
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => voInput.current?.click()}
              className="h-8 border-border bg-transparent text-xs hover:bg-secondary"
            >
              <Upload className="mr-1 h-3 w-3" /> Unggah .mp3
            </Button>
            <Input ref={voInput} type="file" accept="audio/*" className="hidden" onChange={handleVOUpload} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
