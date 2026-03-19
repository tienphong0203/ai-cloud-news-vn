'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Article } from '@/lib/news';
import NewsCard from '@/components/NewsCard';

type Category = 'All' | 'AI' | 'Cloud' | 'Startup' | 'General';

const FILTERS: { label: string; value: Category }[] = [
  { label: 'Tất cả', value: 'All' },
  { label: 'AI', value: 'AI' },
  { label: 'Cloud', value: 'Cloud' },
  { label: 'Startup', value: 'Startup' },
  { label: 'Công nghệ', value: 'General' },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit',
  });
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Category>('All');
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/news', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setArticles(data.articles ?? []);
      setLastUpdated(data.lastUpdated ?? null);
    } catch {
      setError('Không thể tải tin tức. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/refresh');
      await fetchNews();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const filtered = activeFilter === 'All'
    ? articles
    : articles.filter(a => a.category === activeFilter);

  const counts: Record<string, number> = { All: articles.length };
  for (const a of articles) {
    counts[a.category] = (counts[a.category] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#21262D] sticky top-0 z-20 bg-[#0D1117]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill="#0D1117"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="#0D1117" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1
                className="text-base font-bold tracking-tight leading-none"
                style={{ fontFamily: 'Syne, sans-serif', color: '#E6EDF3' }}
              >
                VN Tech Pulse
              </h1>
              <p className="text-[10px] text-[#8B949E] font-mono mt-0.5">AI & Cloud · Việt Nam · 24h</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-accent block" />
              <span className="text-[11px] text-[#8B949E] font-mono">
                {lastUpdated ? formatTime(lastUpdated) : 'Loading...'}
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-[12px] font-mono text-[#8B949E] hover:text-accent transition-colors px-3 py-1.5 rounded-lg border border-[#21262D] hover:border-accent/30 disabled:opacity-40 flex items-center gap-1.5"
            >
              <svg
                width="11" height="11" viewBox="0 0 11 11" fill="none"
                className={refreshing ? 'animate-spin' : ''}
              >
                <path d="M10 5.5a4.5 4.5 0 1 1-1.318-3.182" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M10 1.5v2.5H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {refreshing ? 'Đang tải...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-1 overflow-x-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`shrink-0 text-[12px] font-mono px-3 py-1 rounded-full border transition-all ${
                activeFilter === f.value
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'border-[#21262D] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#30363D]'
              }`}
            >
              {f.label}
              {counts[f.value] !== undefined && (
                <span className="ml-1.5 opacity-60">
                  {counts[f.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#161B22] border border-[#21262D] rounded-xl p-5 animate-pulse"
              >
                <div className="h-3 bg-[#21262D] rounded w-20 mb-3" />
                <div className="h-4 bg-[#21262D] rounded w-full mb-2" />
                <div className="h-4 bg-[#21262D] rounded w-3/4 mb-3" />
                <div className="h-3 bg-[#21262D] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-[#8B949E] font-mono text-sm">{error}</p>
            <button
              onClick={fetchNews}
              className="mt-4 text-accent font-mono text-sm hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#8B949E] font-mono text-sm">Không có tin tức nào trong 24h qua.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-[12px] text-[#8B949E] font-mono">
                <span className="text-[#E6EDF3]">{filtered.length}</span> bài viết
                {activeFilter !== 'All' && ` trong "${activeFilter}"`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((article, i) => (
                <NewsCard key={article.id} article={article} index={i} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#21262D] mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <p className="text-[11px] text-[#8B949E] font-mono">
            VN Tech Pulse · Tổng hợp tự động từ Google News RSS
          </p>
          <p className="text-[11px] text-[#8B949E] font-mono">
            Cập nhật mỗi giờ · Nguồn: báo chí Việt Nam & quốc tế
          </p>
        </div>
      </footer>
    </div>
  );
}
