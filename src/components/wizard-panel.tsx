"use client";
// StoryForge — wizard panel (5 langkah). Editorial tool style, no emoji, Fraunces display.
// language: TypeScript (React 19 client)
import { useCallback, useEffect, useState } from "react";
import { useStoryForge, sceneCount } from "@/lib/store";
import { VOICES, DELIVERY_STYLES, MASTER_PROMPT } from "@/lib/reference-data";
import { VISUAL_STYLES } from "@/lib/visual-styles";
import { STYLE_PREVIEWS } from "@/lib/visual-previews";
import { VisualStylePicker } from "@/components/visual-style-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { AspectRatio, DeliveryStyleId, Duration, Resolution } from "@/lib/types";

interface TrendIdea {
  title: string;
  source: string;
  link: string;
}

const DURATIONS: { v: Duration; t: string }[] = [
  { v: 30, t: "30 dtk" },
  { v: 60, t: "1 mnt" },
  { v: 90, t: "1,5 mnt" },
  { v: 120, t: "2 mnt" },
  { v: 180, t: "3 mnt" },
];

// trending ideas are fetched live from /api/trending (Google News Indonesia RSS)

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-primary">{n}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function WizardPanel({
  onGenerateStoryboard,
  onOpenKeys,
}: {
  onGenerateStoryboard: () => void;
  onOpenKeys: () => void;
}) {
  const store = useStoryForge();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [ideas, setIdeas] = useState<TrendIdea[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendErr, setTrendErr] = useState<string>("");

  const loadTrending = useCallback(async () => {
    setTrendLoading(true);
    setTrendErr("");
    try {
      const r = await fetch("/api/trending", { cache: "no-store" });
      const j = await r.json();
      if (Array.isArray(j.ideas) && j.ideas.length > 0) setIdeas(j.ideas);
      else setTrendErr(j.error || "kosong");
    } catch (e) {
      setTrendErr(e instanceof Error ? e.message : "gagal");
    } finally {
      setTrendLoading(false);
    }
  }, []);

  useEffect(() => {
    // defer initial load out of the sync effect body (avoids cascading setState)
    const t = setTimeout(() => void loadTrending(), 0);
    return () => clearTimeout(t);
  }, [loadTrending]);

  const activeStyle = VISUAL_STYLES.find((s) => s.id === store.visualStyle) ?? VISUAL_STYLES[0];
  const activePreview = STYLE_PREVIEWS[activeStyle.id];

  return (
    <div className="space-y-8">
      <Step n={1} title="Naskah atau pilih ide">
        <Textarea
          rows={5}
          value={store.script}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => store.setScript(e.target.value)}
          placeholder="Tulis naskah / ide ceritamu, atau pilih dari ide trending di bawah."
          className="resize-none bg-background text-sm leading-relaxed"
        />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="eyebrow">Trending hari ini</Label>
            <button
              onClick={loadTrending}
              disabled={trendLoading}
              className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
            >
              {trendLoading ? "memuat…" : "muat ulang"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ideas.slice(0, 8).map((t, i) => (
              <button
                key={`${t.title}-${i}`}
                onClick={() => store.setScript(t.title)}
                title={t.source ? `Sumber: ${t.source}` : undefined}
                className="max-w-full truncate rounded-sm border border-border bg-background px-2.5 py-1 text-left text-xs text-muted-foreground transition hover:border-foreground hover:text-foreground"
              >
                {t.title}
              </button>
            ))}
            {ideas.length === 0 && !trendLoading ? (
              <span className="text-xs text-muted-foreground/70">
                {trendErr ? `Gagal: ${trendErr}` : "Belum ada headline."}
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground/70">Sumber: Google News Indonesia (RSS), realtime.</p>
        </div>
      </Step>

      <Step n={2} title="Durasi, gaya penyampaian & gaya visual">
        <div className="space-y-1.5">
          <Label className="eyebrow">Durasi video</Label>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d.v}
                onClick={() => store.setDuration(d.v)}
                className={`rounded-sm border px-3 py-1.5 text-xs transition ${
                  store.duration === d.v
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.t}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{sceneCount(store.duration)} scene, masing-masing 10 detik</p>
        </div>

        <div className="space-y-1.5">
          <Label className="eyebrow">Gaya penyampaian</Label>
          <div className="space-y-1.5">
            {DELIVERY_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => store.setDeliveryStyle(s.id as DeliveryStyleId)}
                className={`block w-full rounded-sm border p-2.5 text-left transition ${
                  store.deliveryStyle === s.id
                    ? "border-foreground bg-secondary"
                    : "border-border bg-background hover:border-muted-foreground"
                }`}
              >
                <span className="block text-[13px] font-medium text-foreground">{s.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="eyebrow">Gaya visual</Label>
          <button
            onClick={() => setPickerOpen(true)}
            className="flex w-full items-center gap-3 rounded-sm border border-border bg-background p-2 text-left transition hover:border-foreground"
          >
            <span className="h-10 w-14 shrink-0 overflow-hidden rounded-sm bg-secondary">
              {activePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activePreview} alt={activeStyle.label} className="h-full w-full object-cover" />
              ) : (
                <span className="block h-full w-full" style={{ background: "linear-gradient(135deg,#f6e7d3,#e8c9a0)" }} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-foreground">{activeStyle.label}</span>
              <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                {activeStyle.cat} · ganti gaya
              </span>
            </span>
          </button>
        </div>
        <div className="space-y-1.5">
          <Label className="eyebrow">Preset master</Label>
          <Button
            variant="outline"
            onClick={() => store.setMasterPrompt(MASTER_PROMPT)}
            className="w-full bg-background text-sm hover:bg-secondary"
          >
            Reset ke default
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="eyebrow">Master prompt</Label>
          <Textarea
            rows={3}
            value={store.masterPrompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => store.setMasterPrompt(e.target.value)}
            className="resize-none bg-background text-xs leading-relaxed"
          />
          <div className="space-y-1.5">
            <Label className="eyebrow">Arahan gerakan klip (opsional)</Label>
            <Input
              value={store.clipDirection}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => store.setClipDirection(e.target.value)}
              placeholder="mis. kamera perlahan zoom in"
              className="bg-background text-sm"
            />
          </div>
        </div>
      </Step>

      <Step n={3} title="Rasio & resolusi">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="eyebrow">Rasio video</Label>
            <Select value={store.aspectRatio} onValueChange={(v) => store.setAspectRatio(v as AspectRatio)}>
              <SelectTrigger className="w-full bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="16:9" className="text-sm">16:9 (YouTube)</SelectItem>
                <SelectItem value="9:16" className="text-sm">9:16 (Reels/TikTok)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="eyebrow">Resolusi</Label>
            <Select value={String(store.resolution)} onValueChange={(v) => store.setResolution(Number(v) as Resolution)}>
              <SelectTrigger className="w-full bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="720" className="text-sm">720p</SelectItem>
                <SelectItem value="1080" className="text-sm">1080p</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Step>

      <Step n={4} title="Jenis voice over">
        <div className="space-y-1.5">
          <Label className="eyebrow">Suara (mode otomatis)</Label>
          <Select value={store.voice} onValueChange={store.setVoice}>
            <SelectTrigger className="w-full bg-background text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64 bg-popover">
              {VOICES.map((v) => (
                <SelectItem key={v.name} value={v.name} className="text-sm">
                  {v.name} — {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Label mengacu deskripsi suara Gemini TTS; jenis kelamin hanya perkiraan.
          </p>
        </div>
      </Step>

      <Step n={5} title="Cara pembuatan">
        <div className="space-y-1.5">
          {(["auto", "manual"] as const).map((m) => (
            <button
              key={m}
              onClick={() => store.setGenerationMode(m)}
              className={`block w-full rounded-sm border p-3 text-left transition ${
                store.generationMode === m ? "border-foreground bg-secondary" : "border-border bg-background hover:border-muted-foreground"
              }`}
            >
              <span className="block text-[13px] font-medium text-foreground">
                {m === "auto" ? "Otomatis" : "Manual"}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {m === "auto" ? "Satu klik: voice over, semua scene, sampai jadi video" : "Salin prompt, generate & unggah sendiri"}
              </span>
            </button>
          ))}
        </div>
      </Step>

      <div className="space-y-2 border-t border-border pt-5">
        <Button
          onClick={onGenerateStoryboard}
          disabled={store.isGeneratingStoryboard}
          className="h-11 w-full bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {store.isGeneratingStoryboard ? "Menyusun storyboard…" : "Generate storyboard"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Belum isi API key?{" "}
          <button onClick={onOpenKeys} className="font-medium text-primary underline underline-offset-2">
            Isi dulu
          </button>
        </p>
      </div>

      <VisualStylePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={store.visualStyle}
        onSelect={(id) => store.setVisualStyle(id)}
      />
    </div>
  );
}
