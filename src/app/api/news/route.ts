import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/news';
import { getCachedArticles, setCachedArticles, getLastUpdated } from '@/lib/cache';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  // Try cache first
  let articles = await getCachedArticles();
  let lastUpdated = await getLastUpdated();

  if (!articles || articles.length === 0) {
    // Cache empty or expired — fetch fresh from RSS
    articles = await fetchAllNews();
    await setCachedArticles(articles);
    lastUpdated = new Date().toISOString();
  }

  return NextResponse.json({
    articles,
    lastUpdated,
    total: articles.length,
    source: lastUpdated ? 'cache' : 'rss',
  });
}
