import { NextResponse } from "next/server";
import { getCache } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET() {
  const cache = await getCache();

  if (!cache) {
    return NextResponse.json(
      { error: "No data yet. Trigger /api/refresh first." },
      { status: 503 }
    );
  }

  return NextResponse.json(cache, {
    headers: {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}
