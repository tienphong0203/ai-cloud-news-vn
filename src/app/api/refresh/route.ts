import { NextRequest, NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/news';
import { setCachedArticles } from '@/lib/cache';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  // Protect cron endpoint
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const articles = await fetchAllNews();
    await setCachedArticles(articles);

    return NextResponse.json({
      success: true,
      count: articles.length,
      refreshedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Refresh failed:', err);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}

// Vercel cron calls GET, but allow POST for manual trigger
export { GET as POST };
