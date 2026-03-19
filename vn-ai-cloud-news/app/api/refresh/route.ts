import { NextRequest, NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/tavily";
import { setCache } from "@/lib/cache";
import { NewsCache } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Protect cron endpoint
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[refresh] Fetching news from Tavily...");
    const articles = await fetchAllNews();

    const cache: NewsCache = {
      articles,
      lastUpdated: new Date().toISOString(),
    };

    await setCache(cache);

    console.log(`[refresh] Cached ${articles.length} articles.`);
    return NextResponse.json({
      success: true,
      count: articles.length,
      lastUpdated: cache.lastUpdated,
    });
  } catch (err) {
    console.error("[refresh] Error:", err);
    return NextResponse.json({ error: "Failed to refresh" }, { status: 500 });
  }
}
