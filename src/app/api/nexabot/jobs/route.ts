// StoryForge — POST /api/nexabot/jobs — create a generation job
// language: TypeScript (Next 16 route handler, server)
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, nxFetch, readJson, requireKey } from "@/app/api/nexabot/_upstream";


export async function POST(req: NextRequest) {
  const key = requireKey(req);
  if (!key) return errorResponse("x-api-key required", 400);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("invalid json body", 400);
  }
  try {
    const up = await nxFetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify(body),
    });
    const j = await readJson(up);
    if (!up.ok) return NextResponse.json({ error: j["error"] ?? `HTTP ${up.status}` }, { status: up.status });
    return NextResponse.json(j);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "upstream unreachable", 502);
  }
}
