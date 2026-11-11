// StoryForge — GET /api/nexabot/cek-key — validate NexaBot key (passthrough status)
// language: TypeScript (Next 16 route handler, server)
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, nxFetch, readJson, requireKey } from "@/app/api/nexabot/_upstream";


export async function GET(req: NextRequest) {
  const key = requireKey(req);
  if (!key) return errorResponse("x-api-key required", 400);
  try {
    const up = await nxFetch("/jobs/cek-key", { headers: { "x-api-key": key } });
    const j = await readJson(up);
    // Mirror the reference: 401/402/403 = invalid; 404 or ok = accepted
    const status = up.status < 500 ? up.status : 502;
    return NextResponse.json({ status: up.status, error: j["error"] }, { status });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "upstream unreachable", 502);
  }
}
