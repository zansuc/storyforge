"use client";
// StoryForge — visual style picker. 20 art-style cards with preview thumbnails + category filter.
// language: TypeScript (React 19 client)
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { VISUAL_STYLES, STYLE_CATEGORIES, type StyleCategory } from "@/lib/visual-styles";
import { STYLE_PREVIEWS } from "@/lib/visual-previews";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string;
  onSelect: (id: string) => void;
}

// Fallback gradient per kategori for styles without a preview thumbnail.
const CAT_GRADIENT: Record<StyleCategory, string> = {
  "2d": "linear-gradient(135deg,#f6e7d3,#e8c9a0)",
  "3d": "linear-gradient(135deg,#dfe8f5,#b9c9e0)",
  realistis: "linear-gradient(135deg,#e9e3da,#c9bfae)",
  motion: "linear-gradient(135deg,#e6e9ef,#cdd6e2)",
};

export function VisualStylePicker({ open, onOpenChange, value, onSelect }: Props) {
  const [cat, setCat] = useState<"all" | StyleCategory>("all");

  const list = useMemo(
    () => (cat === "all" ? VISUAL_STYLES : VISUAL_STYLES.filter((s) => s.cat === cat)),
    [cat],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-5 pb-4 pt-5">
          <DialogTitle className="text-base font-semibold tracking-tight">Pilih gaya visual</DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {VISUAL_STYLES.length} gaya. Thumbnail adalah contoh hasil; teks diabaikan saat render.
          </p>
          {/* Filter tabs */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STYLE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`rounded-sm border px-3 py-1 text-xs transition-colors duration-150 ${
                  cat === c.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="max-h-[62dvh] overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {list.map((s, i) => {
              const preview = STYLE_PREVIEWS[s.id];
              const active = value === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelect(s.id);
                    onOpenChange(false);
                  }}
                  style={{ animationDelay: `${Math.min(i * 18, 240)}ms` }}
                  className={`group relative overflow-hidden rounded-md border text-left transition-all duration-200 [animation:cardIn_.32s_ease-out_both] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-8px_rgba(28,27,25,.25)] ${
                    active ? "border-foreground ring-1 ring-foreground" : "border-border"
                  }`}
                >
                  <div
                    className="relative aspect-[4/3] w-full overflow-hidden bg-secondary"
                    style={preview ? undefined : { background: CAT_GRADIENT[s.cat] }}
                  >
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt={s.label}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">
                        {s.label}
                      </div>
                    )}
                    {active ? (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                    <span className="truncate text-[12px] font-medium text-foreground">{s.label}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {s.cat}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
