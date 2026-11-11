"use client";
// StoryForge — wizard panel (5 langkah) Tokogame-style.
// language: TypeScript (React 19 client)
import { useStoryForge, sceneCount } from "@/lib/store";
import { VOICES, DELIVERY_STYLES, MASTER_PROMPT } from "@/lib/reference-data";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, Flame, RotateCcw, Volume2 } from "lucide-react";
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
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff6f86] font-mono text-[11px] font-bold text-white">
          {n}
        </span>
        <h3 className="font-mono text-sm font-semibold text-foreground">{title}</h3>
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
    <aside className="space-y-8 rounded-2xl border border-border bg-white p-6">
      {/* Langkah 1 — naskah + trending */}
      <Step n={1} title="Tulis naskah atau pilih ide">
        <Textarea
          rows={5}
          value={store.script}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => store.setScript(e.target.value)}
          placeholder="Tulis naskah / ide ceritamu, atau pilih dari ide trending di bawah."
          className="resize-none border-border bg-background font-mono text-[13px] leading-relaxed focus-visible:ring-[#ff6f86]/40"
        />
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-[#ff6f86]" />
            <span className="mono-label">Trending hari ini</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TRENDING.map((t) => (
              <button
                key={t}
                onClick={() => store.setScript(t)}
                className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition hover:border-[#ff6f86] hover:text-foreground"
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => {
                const shuffled = [...TRENDING].sort(() => Math.random() - 0.5);
                store.setScript(shuffled[0]);
              }}
              className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Muat ulang
            </button>
          </div>
        </div>
      </Step>

      {/* Langkah 2 — durasi, gaya penyampaian, gaya visual */}
      <Step n={2} title="Pilih durasi, gaya penyampaian & gaya visual">
        <div className="space-y-1.5">
          <Label className="mono-label">Durasi video</Label>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d.v}
                onClick={() => store.setDuration(d.v)}
                className={`rounded-lg border px-3 py-1.5 font-mono text-[12px] transition ${
                  store.duration === d.v
                    ? "border-[#ff6f86] bg-[#ff6f86]/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.t}
              </button>
            ))}
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">{sceneCount(store.duration)} scene · 10 detik per scene</p>
        </div>

        <div className="space-y-1.5">
          <Label className="mono-label">Gaya penyampaian</Label>
          <div className="grid gap-1.5">
            {DELIVERY_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => store.setDeliveryStyle(s.id as DeliveryStyleId)}
                className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition ${
                  store.deliveryStyle === s.id
                    ? "border-[#ff6f86] bg-[#ff6f86]/5"
                    : "border-border bg-background hover:border-muted-foreground/40"
                }`}
              >
                <span className="text-base leading-none">{s.emoji}</span>
                <span className="min-w-0">
                  <span className="block font-mono text-[12px] font-semibold text-foreground">{s.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{s.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="mono-label">Gaya visual</Label>
            <Select value={store.visualStyle} onValueChange={(v) => store.setVisualStyle(v as never)}>
              <SelectTrigger className="w-full border-border bg-background font-mono text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-white">
                {["Stickman", "Cinematic", "Anime", "Minimalist"].map((s) => (
                  <SelectItem key={s} value={s} className="font-mono text-[12px]">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="mono-label">Dari Bang Story</Label>
            <Button
              variant="outline"
              onClick={() => store.setMasterPrompt(MASTER_PROMPT)}
              className="w-full border-border bg-background font-mono text-[12px] hover:bg-secondary"
            >
              Ganti preset
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="mono-label">Master prompt</Label>
          <Textarea
            rows={3}
            value={store.masterPrompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => store.setMasterPrompt(e.target.value)}
            className="resize-none border-border bg-background font-mono text-[11px] leading-relaxed focus-visible:ring-[#ff6f86]/40"
          />
          <div className="space-y-1.5">
            <Label className="mono-label">Arahan gerakan klip (opsional)</Label>
            <Input
              value={store.clipDirection}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => store.setClipDirection(e.target.value)}
              placeholder="mis. kamera perlahan zoom in"
              className="border-border bg-background font-mono text-[12px]"
            />
          </div>
        </div>
      </Step>

      {/* Langkah 3 — rasio & resolusi */}
      <Step n={3} title="Pilih rasio video & resolusi">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="mono-label">Rasio video</Label>
            <Select value={store.aspectRatio} onValueChange={(v) => store.setAspectRatio(v as AspectRatio)}>
              <SelectTrigger className="w-full border-border bg-background font-mono text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-white">
                <SelectItem value="16:9" className="font-mono text-[12px]">16:9 (YouTube)</SelectItem>
                <SelectItem value="9:16" className="font-mono text-[12px]">9:16 (Reels/TikTok)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="mono-label">Resolusi</Label>
            <Select value={String(store.resolution)} onValueChange={(v) => store.setResolution(Number(v) as Resolution)}>
              <SelectTrigger className="w-full border-border bg-background font-mono text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-white">
                <SelectItem value="720" className="font-mono text-[12px]">720p</SelectItem>
                <SelectItem value="1080" className="font-mono text-[12px]">1080p</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Step>

      {/* Langkah 4 — voice over */}
      <Step n={4} title="Pilih jenis voice over">
        <div className="space-y-1.5">
          <Label className="mono-label">Suara (dipakai di mode Otomatis)</Label>
          <Select value={store.voice} onValueChange={store.setVoice}>
            <SelectTrigger className="w-full border-border bg-background font-mono text-[12px]">
              <Volume2 className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64 border-border bg-white">
              {VOICES.map((v) => (
                <SelectItem key={v.name} value={v.name} className="font-mono text-[12px]">
                  {v.name} · {v.label} ({v.gender})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Label karakter mengacu deskripsi suara Gemini TTS, jenis kelamin hanya perkiraan.
          </p>
        </div>
      </Step>

      {/* Langkah 5 — mode */}
      <Step n={5} title="Pilih cara pembuatan">
        <div className="grid grid-cols-2 gap-2">
          {(["auto", "manual"] as const).map((m) => (
            <button
              key={m}
              onClick={() => store.setGenerationMode(m)}
              className={`rounded-lg border p-3 text-left transition ${
                store.generationMode === m ? "border-[#ff6f86] bg-[#ff6f86]/5" : "border-border bg-background hover:border-muted-foreground/40"
              }`}
            >
              <div className="font-mono text-[12px] font-semibold text-foreground">
                {m === "auto" ? "⚡ Otomatis" : "✋ Manual"}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {m === "auto" ? "1 tombol: voice over, semua scene, sampai video jadi" : "Salin prompt, generate & upload sendiri"}
              </div>
            </button>
          ))}
        </div>
      </Step>

      {/* Generate */}
      <div className="space-y-2 border-t border-border pt-5">
        <Button
          onClick={onGenerateStoryboard}
          disabled={store.isGeneratingStoryboard}
          className="h-12 w-full bg-[#ff6f86] font-mono text-sm font-semibold text-white shadow-sm hover:bg-[#f25e76]"
        >
          {store.isGeneratingStoryboard ? (
            <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {store.isGeneratingStoryboard ? "Menyusun storyboard…" : "Generate Storyboard & Naskah"}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Belum isi API key?{" "}
          <button onClick={onOpenKeys} className="font-medium text-[#ff6f86] underline">
            Klik di sini
          </button>
        </p>
      </div>
    </aside>
  );
}
