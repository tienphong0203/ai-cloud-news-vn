import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/news';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  const articles = await fetchAllNews();

  return NextResponse.json({
    articles,
    lastUpdated: new Date().toISOString(),
    total: articles.length,
    source: 'rss',
  });
}
