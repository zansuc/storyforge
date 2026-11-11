// StoryForge — GET /api/nexabot/jobs/:id/download — stream artifact to browser
// language: TypeScript (Next 16 route handler, server)
import { NextRequest } from "next/server";
import { errorResponse, nxFetch, readJson, requireKey } from "@/app/api/nexabot/_upstream";


export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const key = requireKey(req);
  if (!key) return errorResponse("x-api-key required", 400);
  try {
    const up = await nxFetch(`/jobs/${encodeURIComponent(id)}/download`, { headers: { "x-api-key": key } });
    if (!up.ok) {
      const j = await readJson(up);
      return errorResponse((j["error"] as string) ?? `HTTP ${up.status}`, up.status);
    }
    const blob = await up.blob();
    return new Response(blob, {
      headers: {
        "Content-Type": blob.type || "application/octet-stream",
        "Content-Disposition": 'attachment; filename="storyforge-clip.mp4"',
      },
    });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "upstream unreachable", 502);
  }
}
