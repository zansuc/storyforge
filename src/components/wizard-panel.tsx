"use client";
// StoryForge — wizard panel (5 langkah). Editorial tool style, no emoji, Fraunces display.
// language: TypeScript (React 19 client)
import { useStoryForge, sceneCount } from "@/lib/store";
import { VOICES, DELIVERY_STYLES, MASTER_PROMPT } from "@/lib/reference-data";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { AspectRatio, DeliveryStyleId, Duration, Resolution } from "@/lib/types";

const DURATIONS: { v: Duration; t: string }[] = [
  { v: 30, t: "30 dtk" },
  { v: 60, t: "1 mnt" },
  { v: 90, t: "1,5 mnt" },
  { v: 120, t: "2 mnt" },
  { v: 180, t: "3 mnt" },
];

const TRENDING = [
  "Rahasia AC Alamiah Mesir Kuno",
  "Kenapa Kucing Takut Timun?",
  "Sejarah Cepat: Kemerdekaan",
  "Mitos vs Fakta Otak Manusia",
  "Cara Kerja Internet dalam 1 Menit",
];

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
          <Label className="eyebrow">Trending hari ini</Label>
          <div className="flex flex-wrap gap-1.5">
            {TRENDING.map((t) => (
              <button
                key={t}
                onClick={() => store.setScript(t)}
                className="rounded-sm border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition hover:border-foreground hover:text-foreground"
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => {
                const shuffled = [...TRENDING].sort(() => Math.random() - 0.5);
                store.setScript(shuffled[0]);
              }}
              className="rounded-sm border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Muat ulang
            </button>
          </div>
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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="eyebrow">Gaya visual</Label>
            <Select value={store.visualStyle} onValueChange={(v) => store.setVisualStyle(v as never)}>
              <SelectTrigger className="w-full bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {["Stickman", "Cinematic", "Anime", "Minimalist"].map((s) => (
                  <SelectItem key={s} value={s} className="text-sm">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
    </div>
  );
}
