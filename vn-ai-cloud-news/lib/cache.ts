import { kv } from "@vercel/kv";
import { NewsCache } from "./types";

const CACHE_KEY = "vn_ai_cloud_news";

export async function getCache(): Promise<NewsCache | null> {
  try {
    const data = await kv.get<NewsCache>(CACHE_KEY);
    return data;
  } catch (err) {
    console.error("KV get error:", err);
    return null;
  }
}

export async function setCache(data: NewsCache): Promise<void> {
  try {
    // TTL: 2 hours (cron runs every hour, buffer for safety)
    await kv.set(CACHE_KEY, data, { ex: 60 * 60 * 2 });
  } catch (err) {
    console.error("KV set error:", err);
  }
}
