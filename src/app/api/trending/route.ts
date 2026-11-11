// StoryForge — trending ideas from Google News Indonesia RSS (server-side, no CORS, no API key).
// language: TypeScript (Next App Router route handler, edge-friendly)
import { NextResponse } from "next/server";

const FEED = "https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export async function GET() {
  try {
    const res = await fetch(FEED, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}`, ideas: [] }, { status: 200 });
    }
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    const ideas: { title: string; source: string; link: string; published: string }[] = [];

    for (const it of items) {
      const block = it[1];
      const rawTitle = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
      const title = decodeEntities(rawTitle.replace(/<!\[CDATA\[|\]\]>/g, ""));
      if (!title) continue;
      // Google News title format: "Headline - Source"
      const parts = title.split(" - ");
      const source = parts.length > 1 ? parts.pop()!.trim() : "";
      const headline = parts.join(" - ").trim();
      const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
      const published = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
      ideas.push({ title: headline, source, link, published });
      if (ideas.length >= 20) break;
    }

    return NextResponse.json(
      { ideas, fetchedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fetch failed", ideas: [] },
      { status: 200 },
    );
  }
}
