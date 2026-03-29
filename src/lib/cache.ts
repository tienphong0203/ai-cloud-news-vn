import type { Article } from './news';

// In-memory cache — works on Vercel serverless (shared within same instance)
let cachedArticles: Article[] | null = null;
let cachedAt: string | null = null;
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function getCachedArticles(): Promise<Article[] | null> {
  if (!cachedArticles || !cachedAt) return null;

  const age = Date.now() - new Date(cachedAt).getTime();
  if (age > TTL_MS) {
    // Cache expired
    cachedArticles = null;
    cachedAt = null;
    return null;
  }

  return cachedArticles;
}

export async function setCachedArticles(articles: Article[]): Promise<void> {
  cachedArticles = articles;
  cachedAt = new Date().toISOString();
}

export async function getLastUpdated(): Promise<string | null> {
  return cachedAt;
}
