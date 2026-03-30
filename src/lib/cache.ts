import type { NewsItem } from './rss';

let cachedArticles: NewsItem[] | null = null;
let cachedAt: string | null = null;
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function getCachedArticles(): Promise<NewsItem[] | null> {
  if (!cachedArticles || !cachedAt) return null;
  if (Date.now() - new Date(cachedAt).getTime() > TTL_MS) {
    cachedArticles = null;
    cachedAt = null;
    return null;
  }
  return cachedArticles;
}

export async function setCachedArticles(articles: NewsItem[]): Promise<void> {
  cachedArticles = articles;
  cachedAt = new Date().toISOString();
}

export async function getLastUpdated(): Promise<string | null> {
  return cachedAt;
}
