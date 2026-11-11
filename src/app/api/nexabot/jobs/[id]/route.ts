// StoryForge — GET /api/nexabot/jobs/:id — poll job status
// language: TypeScript (Next 16 route handler, server)
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, nxFetch, readJson, requireKey } from "@/app/api/nexabot/_upstream";


export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const key = requireKey(req);
  if (!key) return errorResponse("x-api-key required", 400);
  try {
    const up = await nxFetch(`/jobs/${encodeURIComponent(id)}`, { headers: { "x-api-key": key } });
    const j = await readJson(up);
    if (!up.ok) return NextResponse.json({ error: j["error"] ?? `HTTP ${up.status}` }, { status: up.status });
    return NextResponse.json(j);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "upstream unreachable", 502);
  }
}
