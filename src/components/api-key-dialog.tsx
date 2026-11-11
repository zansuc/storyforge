"use client";
// StoryForge — API Key Manager dialog (settings modal). Mono, near-black, lime accent.
// language: TypeScript (React 19 + shadcn radix dialog)
import { useState } from "react";
import { useStoryForge } from "@/lib/store";
import { validateGeminiKey } from "@/lib/gemini";
import { validateNexabotKey } from "@/lib/nexabot";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

type KeyStatus = "idle" | "checking" | "ok" | "err";

function StatusDot({ status }: { status: KeyStatus }) {
  const color =
    status === "checking"
      ? "bg-muted-foreground animate-pulse"
      : status === "ok"
        ? "bg-primary"
        : status === "err"
          ? "bg-destructive"
          : "bg-muted-foreground/40";
  const text = status === "checking" ? "cek" : status === "ok" ? "aktif" : status === "err" ? "error" : "kosong";
  return (
    <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {text}
    </span>
  );
}

function KeyRow({
  label,
  value,
  onChange,
  placeholder,
  status,
  statusMsg,
  onCheck,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  status: KeyStatus;
  statusMsg: string;
  onCheck: () => Promise<void>;
}) {
  const busy = status === "checking";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={label} className="mono-label">
          {label}
        </label>
        <StatusDot status={status} />
      </div>
      <div className="flex gap-2">
        <Input
          id={label}
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="border-border bg-secondary/40 font-mono text-[13px]"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onCheck}
          disabled={busy || !value}
          className="border-border bg-transparent font-mono text-xs hover:bg-secondary"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Tes"}
        </Button>
      </div>
      {statusMsg && status !== "idle" ? (
        <p className={`font-mono text-[11px] ${status === "ok" ? "text-primary" : status === "err" ? "text-destructive" : "text-muted-foreground"}`}>
          {statusMsg}
        </p>
      ) : null}
    </div>
  );
}

export function ApiKeyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { geminiApiKey, setGeminiApiKey, nexabotApiKey, setNexabotApiKey } = useStoryForge();

  const [gMsg, setGMsg] = useState("");
  const [nMsg, setNMsg] = useState("");
  const [gResult, setGResult] = useState<KeyStatus>("idle");
  const [nResult, setNResult] = useState<KeyStatus>("idle");

  const gStatus: KeyStatus = gResult === "checking" || gResult === "err" ? gResult : geminiApiKey ? "ok" : "idle";
  const nStatus: KeyStatus = nResult === "checking" || nResult === "err" ? nResult : nexabotApiKey ? "ok" : "idle";

  const checkGemini = async () => {
    if (!geminiApiKey) return;
    setGResult("checking");
    setGMsg("");
    const res = await validateGeminiKey(geminiApiKey);
    setGResult(res.ok ? "ok" : "err");
    setGMsg(res.message ?? (res.ok ? "Kunci valid." : ""));
  };

  const checkNexabot = async () => {
    if (!nexabotApiKey) return;
    setNResult("checking");
    setNMsg("");
    const res = await validateNexabotKey(nexabotApiKey);
    setNResult(res.ok ? "ok" : "err");
    setNMsg(res.message ?? (res.ok ? "Kunci diterima." : ""));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-base font-medium tracking-tight">Kunci API</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
            Kunci disimpan di localStorage browser ini — tidak dikirim ke server StoryForge.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-2">
          <KeyRow
            label="GEMINI_API_KEY"
            value={geminiApiKey}
            onChange={setGeminiApiKey}
            placeholder="AIza…"
            status={gStatus}
            statusMsg={gMsg}
            onCheck={checkGemini}
          />
          <KeyRow
            label="NEXABOT_API_KEY"
            value={nexabotApiKey}
            onChange={setNexabotApiKey}
            placeholder="nx_…"
            status={nStatus}
            statusMsg={nMsg}
            onCheck={checkNexabot}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="font-mono text-[13px]">
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MaskedApiIndicators() {
  const geminiApiKey = useStoryForge((s) => s.geminiApiKey);
  const nexabotApiKey = useStoryForge((s) => s.nexabotApiKey);
  return (
    <div className="flex items-center gap-4">
      {[
        { name: "Gemini", ok: !!geminiApiKey },
        { name: "NexaBot", ok: !!nexabotApiKey },
      ].map((k) => (
        <span key={k.name} className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${k.ok ? "bg-primary" : "bg-muted-foreground/40"}`} />
          {k.name}
        </span>
      ))}
    </div>
  );
}
