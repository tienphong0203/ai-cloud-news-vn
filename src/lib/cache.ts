import { kv } from '@vercel/kv';
import type { Article } from './news';

const CACHE_KEY = 'vn_tech_news_articles';
const LAST_UPDATED_KEY = 'vn_tech_news_updated_at';
const TTL = 60 * 60 * 2; // 2 hours

export async function getCachedArticles(): Promise<Article[] | null> {
  try {
    const data = await kv.get<Article[]>(CACHE_KEY);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function setCachedArticles(articles: Article[]): Promise<void> {
  await kv.set(CACHE_KEY, articles, { ex: TTL });
  await kv.set(LAST_UPDATED_KEY, new Date().toISOString(), { ex: TTL });
}

export async function getLastUpdated(): Promise<string | null> {
  try {
    return await kv.get<string>(LAST_UPDATED_KEY);
  } catch {
    return null;
  }
}
