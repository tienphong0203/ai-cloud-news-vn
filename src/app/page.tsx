'use client';

import { useEffect, useState, useMemo } from 'react';
import type { NewsItem } from '@/lib/rss';

// ── Helpers ───────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

const REGIONS = ['Tất cả', 'Vietnam', 'China', 'USA', 'Europe'];

// Theme colors: [dark, light]
const T = (dark: boolean, d: string, l: string) => dark ? d : l;

// ── Component ─────────────────────────────────────────────────────
export default function HomePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [region, setRegion] = useState('Tất cả');
  const [showNotif, setShowNotif] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dark, setDark] = useState(true);

  const markAsRead = (id: string) => setReadIds(prev => new Set(prev).add(id));
  const markAllRead = () => setReadIds(new Set(competitors.map(a => a.id)));

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news', { cache: 'no-store' });
      const data: NewsItem[] = await res.json();
      setNews(data);
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await fetch('/api/refresh'); await fetchNews(); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { fetchNews(); }, []);

  const filtered = useMemo(() =>
    region === 'Tất cả' ? news : news.filter(n => n.region === region),
  [news, region]);

  const competitors = useMemo(() =>
    news.filter(n => n.isCompetitor && n.competitorName).slice(0, 5),
  [news]);

  const notifications = useMemo(() =>
    competitors.map(a => ({
      id: a.id, text: `[${a.competitorName}] ${a.title}`, time: timeAgo(a.pubDate), url: a.link,
    })),
  [competitors]);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  // ── RENDER ────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? 'bg-[#0a0a0c] text-white' : 'bg-[#f8fafc] text-[#0f172a]'}`}>
      {/* ═══ HEADER ═══ */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${dark ? 'bg-[#0a0a0c]/90 border-[#2a2d35]' : 'bg-white/90 border-[#e2e8f0]'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00ff66] flex items-center justify-center font-bold text-black text-sm">G</div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-[#00ff66]">GREENNODE</span> RADAR
            </span>
          </div>

          {/* Region filters */}
          <nav className="hidden md:flex items-center gap-1">
            {REGIONS.map(r => (
              <button key={r} onClick={() => setRegion(r)}
                className={`px-3 py-1 text-sm rounded-full transition-all ${
                  region === r ? 'text-[#00ff66] font-semibold' : 'text-[#9ca3af] hover:text-white'
                }`}
              >{r}</button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)}
                className={`relative p-2 transition-colors rounded-lg border hover:text-[#00ff66] hover:border-[#00ff66]/30 ${T(dark, 'text-[#9ca3af] border-[#2a2d35]', 'text-[#64748b] border-[#e2e8f0]')}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className={`absolute right-0 top-11 w-80 rounded-xl shadow-2xl z-50 overflow-hidden border ${T(dark, 'bg-[#121418] border-[#2a2d35]', 'bg-white border-[#e2e8f0]')}`}>
                  <div className="p-3 border-b border-[#2a2d35] flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider">Thông báo đối thủ</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] text-[#00ff66] hover:underline">Đã đọc tất cả</button>
                      )}
                      <button onClick={() => setShowNotif(false)} className="text-[#9ca3af] hover:text-white text-xs">Đóng</button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => {
                      const isRead = readIds.has(n.id);
                      return (
                        <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
                          onClick={() => markAsRead(n.id)}
                          className={`block p-3 border-b border-[#2a2d35]/50 hover:bg-[#2a2d35]/30 transition-colors ${isRead ? 'opacity-50' : ''}`}>
                          <div className="flex items-start gap-2">
                            {!isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#00ff66] shrink-0" />}
                            <div>
                              <p className="text-sm mb-1 line-clamp-2">{n.text}</p>
                              <span className="text-[10px] text-[#9ca3af]">{n.time}</span>
                            </div>
                          </div>
                        </a>
                      );
                    }) : (
                      <div className="p-6 text-center text-sm text-[#9ca3af]">Chưa có hoạt động mới từ đối thủ.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button onClick={() => setDark(!dark)}
              className={`p-2 rounded-lg border transition-colors ${dark ? 'text-[#9ca3af] border-[#2a2d35] hover:text-yellow-400 hover:border-yellow-400/30' : 'text-[#64748b] border-[#e2e8f0] hover:text-indigo-500 hover:border-indigo-500/30'}`}>
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Refresh */}
            <button onClick={handleRefresh} disabled={refreshing}
              className={`text-xs hover:text-[#00ff66] px-3 py-1.5 rounded-lg border hover:border-[#00ff66]/30 disabled:opacity-40 transition-colors ${T(dark, 'text-[#9ca3af] border-[#2a2d35]', 'text-[#64748b] border-[#e2e8f0]')}`}>
              {refreshing ? 'Đang tải...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Mobile region filters */}
        <div className="md:hidden max-w-7xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
          {REGIONS.map(r => (
            <button key={r} onClick={() => setRegion(r)}
              className={`shrink-0 px-3 py-1 text-xs rounded-full border transition-all ${
                region === r ? 'border-[#00ff66]/40 text-[#00ff66] bg-[#00ff66]/10' : 'border-[#2a2d35] text-[#9ca3af]'
              }`}
            >{r}</button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="w-8 h-8 border-2 border-[#00ff66] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ═══ HERO + 4 CARDS ═══ */}
            <section className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-[#2a2d35] pb-2">
                <span className="text-[#00ff66]">&#9889;</span>
                {region === 'Tất cả' ? 'Tin tức nổi bật (48h)' : `Tin tức ${region}`}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Hero */}
                {filtered[0] && (
                  <a href={filtered[0].link} target="_blank" rel="noopener noreferrer"
                    className={`lg:col-span-7 relative group overflow-hidden rounded-xl border hover:border-[#00ff66]/40 transition-colors ${T(dark, 'border-[#2a2d35]', 'border-[#e2e8f0]')}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={filtered[0].thumbnail || `https://picsum.photos/seed/${filtered[0].id.slice(-5)}/800/400`}
                      alt="" className={`w-full h-[380px] object-cover transition-opacity ${dark ? 'opacity-60 group-hover:opacity-80' : 'opacity-90 group-hover:opacity-100'}`} referrerPolicy="no-referrer" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6">
                      <span className="inline-block px-3 py-1 mb-3 text-xs font-bold text-black bg-[#00ff66] rounded-full">{filtered[0].tag}</span>
                      <h3 className="text-xl font-bold leading-tight mb-2 group-hover:text-[#00ff66] transition-colors">{filtered[0].title}</h3>
                      <span className="text-sm text-gray-300">{timeAgo(filtered[0].pubDate)} &middot; {filtered[0].source}</span>
                    </div>
                  </a>
                )}

                {/* 4 side cards */}
                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.slice(1, 5).map(item => (
                    <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer"
                      className={`flex flex-col rounded-xl border overflow-hidden hover:border-[#00ff66]/30 transition-colors p-3 ${T(dark, 'border-[#2a2d35] bg-[#121418]', 'border-[#e2e8f0] bg-white')}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.thumbnail || `https://picsum.photos/seed/${item.id.slice(-5)}/400/200`}
                        alt="" className={`w-full h-28 object-cover rounded-lg mb-2 ${dark ? 'opacity-90' : 'opacity-100'}`} referrerPolicy="no-referrer" />
                      <span className="text-[10px] font-bold text-[#00ff66] mb-1">{item.tag}</span>
                      <h4 className="text-sm font-semibold line-clamp-2 mb-auto">{item.title}</h4>
                      <span className="text-[11px] text-[#9ca3af] mt-2">{timeAgo(item.pubDate)}</span>
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {/* ═══ TIMELINE + RADAR SIDEBAR ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Timeline */}
              <div className="lg:col-span-2">
                <h2 className="text-base font-bold border-b border-[#2a2d35] pb-2 mb-4">Dòng sự kiện mới nhất</h2>
                <div className="flex flex-col gap-3">
                  {filtered.slice(5).map(item => (
                    <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer"
                      className={`p-4 rounded-xl border transition-colors group ${T(dark, 'border-[#2a2d35] bg-[#121418] hover:bg-[#2a2d35]/20', 'border-[#e2e8f0] bg-white hover:bg-[#f1f5f9]')}`}>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[11px] font-bold text-blue-400 uppercase">{item.source} &middot; {item.tag}</span>
                        <span className="text-[10px] text-[#9ca3af] shrink-0">{timeAgo(item.pubDate)}</span>
                      </div>
                      <h3 className="text-sm font-semibold mb-1.5 group-hover:text-[#00ff66] transition-colors">{item.title}</h3>
                      <p className="text-xs text-[#9ca3af] line-clamp-2">{item.content.split('.').slice(0, 2).join('.') + '.'}</p>
                    </a>
                  ))}
                  {filtered.length === 0 && (
                    <div className="p-12 text-center border border-dashed border-[#2a2d35] rounded-xl">
                      <p className="text-[#9ca3af]">Không tìm thấy tin tức nào trong 48h qua.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Competitor Radar */}
              <div className="lg:col-span-1">
                <div className={`sticky top-20 p-5 rounded-xl border relative overflow-hidden ${T(dark, 'border-red-900/50 bg-red-950/20', 'border-red-200 bg-red-50')}`}>
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                  <div className="flex items-center gap-2 mb-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <h2 className="text-base font-bold text-red-500 uppercase tracking-wide">Radar Đối Thủ</h2>
                  </div>
                  <div className="flex flex-col gap-4">
                    {competitors.length > 0 ? competitors.map(a => (
                      <a key={a.id} href={a.link} target="_blank" rel="noopener noreferrer"
                        className="border-b border-red-900/30 pb-3 last:border-0 last:pb-0 block group">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm group-hover:text-red-400 transition-colors">{a.competitorName}</span>
                          <span className="text-[10px] text-red-400/70 border border-red-900/50 px-2 py-0.5 rounded">{timeAgo(a.pubDate)}</span>
                        </div>
                        <p className={`text-sm line-clamp-2 transition-colors ${T(dark, 'text-gray-300 group-hover:text-white', 'text-gray-700 group-hover:text-black')}`}>{a.title}</p>
                        <span className="text-[10px] text-[#9ca3af] mt-1 block">{a.source}</span>
                      </a>
                    )) : (
                      <div className="text-center py-8 border border-dashed border-red-900/30 rounded-lg">
                        <p className="text-sm text-gray-500 italic">Không có biến động mới từ đối thủ trong 48h qua.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className={`border-t mt-12 py-6 ${T(dark, 'border-[#2a2d35]', 'border-[#e2e8f0]')}`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-[#9ca3af]">GreenNode Radar &middot; Tổng hợp tự động từ 18 nguồn RSS</p>
          <p className="text-[11px] text-[#9ca3af]">Cập nhật hàng ngày &middot; Nguồn: báo chí Việt Nam &amp; quốc tế</p>
        </div>
      </footer>
    </div>
  );
}
