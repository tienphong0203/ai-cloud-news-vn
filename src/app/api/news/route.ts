import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/rss';
import { getCachedArticles, setCachedArticles } from '@/lib/cache';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  // Try cache first
  let articles = await getCachedArticles();

  if (!articles || articles.length === 0) {
    articles = await fetchAllNews();
    await setCachedArticles(articles);
  }

  return NextResponse.json(articles);
}
