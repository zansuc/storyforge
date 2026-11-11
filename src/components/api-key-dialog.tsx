"use client";
// StoryForge — API Key Manager dialog (settings modal).
// language: TypeScript (React 19 + shadcn radix dialog)
import { useState } from "react";
import { useStoryForge } from "@/lib/store";
import { validateGeminiKey } from "@/lib/gemini";
import { validateNexabotKey } from "@/lib/nexabot";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Loader2 } from "lucide-react";

type KeyStatus = "idle" | "checking" | "ok" | "err";

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
        <Label htmlFor={label} className="text-sm font-medium">
          {label}
        </Label>
        <Badge
          variant={status === "ok" ? "default" : status === "err" ? "destructive" : "outline"}
          className={status === "ok" ? "bg-emerald-600" : ""}
        >
          {busy ? "mengecek…" : status === "ok" ? "terhubung" : status === "err" ? "error" : "belum"}
        </Badge>
      </div>
      <div className="flex gap-2">
        <Input
          id={label}
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        <Button variant="outline" size="sm" onClick={onCheck} disabled={busy || !value}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tes"}
        </Button>
      </div>
      {statusMsg && status !== "idle" ? (
        <p className={`text-xs ${status === "ok" ? "text-emerald-600" : status === "err" ? "text-destructive" : "text-muted-foreground"}`}>
          {statusMsg}
        </p>
      ) : null}
    </div>
  );
}

export function ApiKeyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const {
    geminiApiKey,
    setGeminiApiKey,
    nexabotApiKey,
    setNexabotApiKey,
  } = useStoryForge();

  const [gMsg, setGMsg] = useState("");
  const [nMsg, setNMsg] = useState("");

  // Derived status: a key that exists is "ok"; a check may override with checking/err.
  const [gResult, setGResult] = useState<KeyStatus>("idle");
  const [nResult, setNResult] = useState<KeyStatus>("idle");
  const gStatus: KeyStatus =
    gResult === "checking" || gResult === "err" ? gResult : geminiApiKey ? "ok" : "idle";
  const nStatus: KeyStatus =
    nResult === "checking" || nResult === "err" ? nResult : nexabotApiKey ? "ok" : "idle";

  // Reset check messages whenever the dialog reopens (reset happens in handlers, not effect).
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> API Keys
          </DialogTitle>
          <DialogDescription>
            Kunci disimpan di localStorage browser ini — tidak dikirim ke server StoryForge.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2">
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
          <Button onClick={() => onOpenChange(false)}>Selesai</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MaskedApiIndicators() {
  const geminiApiKey = useStoryForge((s) => s.geminiApiKey);
  const nexabotApiKey = useStoryForge((s) => s.nexabotApiKey);
  return (
    <div className="flex items-center gap-2">
      <Badge variant={geminiApiKey ? "default" : "outline"} className={geminiApiKey ? "bg-emerald-600" : ""}>
        Gemini {geminiApiKey ? "✓" : "—"}
      </Badge>
      <Badge variant={nexabotApiKey ? "default" : "outline"} className={nexabotApiKey ? "bg-emerald-600" : ""}>
        NexaBot {nexabotApiKey ? "✓" : "—"}
      </Badge>
    </div>
  );
}
