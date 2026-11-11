"use client";
// StoryForge — settings panel (left sticky pane content).
// language: TypeScript (React 19 client)
import { useStoryForge, sceneCount } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { AspectRatio, Duration, GenerationMode, Resolution, VisualStyle, VoiceoverMode } from "@/lib/types";

function Sel({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: readonly { v: string; t: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="mono-label">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full border-border bg-secondary/50 font-mono text-[13px]">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent className="border-border bg-popover">
          {items.map((it) => (
            <SelectItem key={it.v} value={it.v} className="font-mono text-[13px]">
              {it.t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const STYLE_ITEMS = [
  { v: "Stickman", t: "Stickman" },
  { v: "Cinematic", t: "Cinematic" },
  { v: "Anime", t: "Anime" },
  { v: "Minimalist", t: "Minimalist" },
] as const;

const RATIO_ITEMS = [
  { v: "9:16", t: "9:16 vertikal" },
  { v: "16:9", t: "16:9 lanskap" },
] as const;

const RES_ITEMS = [
  { v: "720", t: "720p" },
  { v: "1080", t: "1080p" },
] as const;

const VO_ITEMS = [
  { v: "ai", t: "AI (NexaBot)" },
  { v: "upload", t: "Unggah .mp3" },
] as const;

const MODE_ITEMS = [
  { v: "auto", t: "Auto (NexaBot)" },
  { v: "manual", t: "Manual" },
] as const;

export function SettingsPanel() {
  const store = useStoryForge();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="mono-label">Scene</span>
        <span className="font-mono text-sm text-primary">
          {sceneCount(store.duration)} · {store.duration}s
        </span>
      </div>
      <Slider
        value={[store.duration]}
        min={30}
        max={90}
        step={30}
        onValueChange={([v]) => v && store.setDuration(v as Duration)}
        className="[&_[role=slider]]:border-primary [&_[role=slider]]:bg-primary"
      />

      <Sel label="Gaya" value={store.visualStyle} onChange={(v) => store.setVisualStyle(v as VisualStyle)} items={STYLE_ITEMS} />
      <Sel label="Rasio" value={store.aspectRatio} onChange={(v) => store.setAspectRatio(v as AspectRatio)} items={RATIO_ITEMS} />
      <Sel
        label="Resolusi"
        value={String(store.resolution)}
        onChange={(v) => store.setResolution(Number(v) as Resolution)}
        items={RES_ITEMS}
      />
      <Sel label="Voiceover" value={store.voiceoverMode} onChange={(v) => store.setVoiceoverMode(v as VoiceoverMode)} items={VO_ITEMS} />
      <Sel label="Mode" value={store.generationMode} onChange={(v) => store.setGenerationMode(v as GenerationMode)} items={MODE_ITEMS} />
    </div>
  );
}
