'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return 'Vừa xong';
  if (diffHrs < 24) return `${diffHrs} giờ trước`;
  return date.toLocaleDateString('vi-VN');
}

function formatClock(iso: string) {
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
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Competitor radar — real articles mentioning FPT, Viettel, CMC, etc.
  const competitorArticles = useMemo(() => {
    return articles
      .filter(a => a.isCompetitor && a.competitorName)
      .slice(0, 5);
  }, [articles]);

  // Notifications from competitor news
  const notifications = useMemo(() => {
    return competitorArticles.map((a, i) => ({
      id: i,
      text: `[${a.competitorName}] ${a.title}`,
      time: formatTime(a.publishedAt),
      url: a.url,
    }));
  }, [competitorArticles]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#21262D] sticky top-0 z-20 bg-[#0D1117]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill="#0D1117"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="#0D1117" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none" style={{ color: '#E6EDF3' }}>
                GreenNode Radar
              </h1>
              <p className="text-[10px] text-[#8B949E] font-mono mt-0.5">AI & Cloud · Việt Nam · 24h</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-accent block" />
              <span className="text-[11px] text-[#8B949E] font-mono">
                {lastUpdated ? formatClock(lastUpdated) : 'Loading...'}
              </span>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-[#8B949E] hover:text-accent transition-colors p-1.5 rounded-lg border border-[#21262D] hover:border-accent/30"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-10 w-80 bg-[#161B22] border border-[#21262D] rounded-lg shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-[#21262D] flex justify-between items-center bg-[#21262D]/30">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3]">Thông báo đối thủ</span>
                    <button onClick={() => setShowNotifications(false)} className="text-[#8B949E] hover:text-white text-xs">Đóng</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                      <a
                        key={n.id}
                        href={n.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border-b border-[#21262D]/50 hover:bg-[#21262D]/30 transition-colors"
                      >
                        <p className="text-sm text-[#E6EDF3] mb-1 line-clamp-2">{n.text}</p>
                        <span className="text-[10px] text-[#8B949E]">{n.time}</span>
                      </a>
                    )) : (
                      <div className="p-6 text-center">
                        <p className="text-sm text-[#8B949E]">Chưa có hoạt động mới từ đối thủ.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-[12px] font-mono text-[#8B949E] hover:text-accent transition-colors px-3 py-1.5 rounded-lg border border-[#21262D] hover:border-accent/30 disabled:opacity-40 flex items-center gap-1.5"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className={refreshing ? 'animate-spin' : ''}>
                <path d="M10 5.5a4.5 4.5 0 1 1-1.318-3.182" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M10 1.5v2.5H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {refreshing ? 'Đang tải...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-1 overflow-x-auto scrollbar-hide">
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
                <span className="ml-1.5 opacity-60">{counts[f.value]}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-[#161B22] border border-[#21262D] rounded-xl p-5 animate-pulse">
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
            <button onClick={fetchNews} className="mt-4 text-accent font-mono text-sm hover:underline">Thử lại</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#8B949E] font-mono text-sm">Không có tin tức nào trong 24h qua.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* News column */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[12px] text-[#8B949E] font-mono">
                  <span className="text-[#E6EDF3]">{filtered.length}</span> bài viết
                  {activeFilter !== 'All' && ` trong "${activeFilter}"`}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((article, i) => (
                  <NewsCard key={article.id} article={article} index={i} />
                ))}
              </div>
            </div>

            {/* Radar Đối Thủ sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 p-5 rounded-xl border border-red-900/50 bg-red-950/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                <div className="flex items-center gap-2 mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <h2 className="text-lg font-bold text-red-500 uppercase tracking-wide">Radar Đối Thủ</h2>
                </div>

                <div className="flex flex-col gap-4">
                  {competitorArticles.length > 0 ? (
                    competitorArticles.map(a => (
                      <a
                        key={a.id}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-b border-red-900/30 pb-3 last:border-0 last:pb-0 block group cursor-pointer"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[#E6EDF3] text-sm group-hover:text-red-400 transition-colors">
                            {a.competitorName}
                          </span>
                          <span className="text-[10px] text-red-400/70 border border-red-900/50 px-2 py-0.5 rounded">
                            {formatTime(a.publishedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2 group-hover:text-white transition-colors">
                          {a.title}
                        </p>
                        <p className="text-[11px] text-[#8B949E] mt-1">{a.source}</p>
                      </a>
                    ))
                  ) : (
                    <div className="text-center py-8 border border-dashed border-red-900/30 rounded-lg">
                      <p className="text-sm text-gray-500 italic">Không có biến động mới từ đối thủ trong 24h qua.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#21262D] mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p className="text-[11px] text-[#8B949E] font-mono">
            GreenNode Radar · Tổng hợp tự động từ Google News RSS
          </p>
          <p className="text-[11px] text-[#8B949E] font-mono">
            Cập nhật hàng ngày · Nguồn: báo chí Việt Nam & quốc tế
          </p>
        </div>
      </footer>
    </div>
  );
}
