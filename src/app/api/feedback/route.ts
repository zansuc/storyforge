// StoryForge — reply feedback proxy.
// Coarena wants POST /api/v1/feedback {request_id, rating} and rejects the body `id`
// (it must be the `req_...` value from the x-coarena-request-id header of the reply).
// language: TypeScript (Next App Router route handler, node runtime)
import { NextResponse } from "next/server";
import { feedback } from "@/lib/coarena";

export async function POST(request: Request) {
  const key = process.env.COARENA_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "COARENA_API_KEY belum terpasang." }, { status: 500 });
  }

  let payload: { requestId?: string; rating?: number };
  try {
    payload = (await request.json()) as { requestId?: string; rating?: number };
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }

  const requestId = (payload?.requestId ?? "").trim();
  const rating = payload?.rating;
  if (!requestId) {
    return NextResponse.json({ error: "requestId wajib diisi." }, { status: 400 });
  }
  if (rating !== 1 && rating !== -1) {
    return NextResponse.json({ error: "rating harus 1 atau -1." }, { status: 400 });
  }
  const verdict: 1 | -1 = rating === 1 ? 1 : -1;

  const ok = await feedback(key, requestId, verdict);
  if (!ok) {
    return NextResponse.json({ error: "Coarena menolak feedback." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
