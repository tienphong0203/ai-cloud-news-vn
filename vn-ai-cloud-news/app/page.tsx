"use client";

import { useEffect, useState, useCallback } from "react";
import { Article, Category, NewsCache } from "@/lib/types";
import {
  RefreshCw,
  ExternalLink,
  Clock,
  Cpu,
  Cloud,
  Rocket,
  LayoutGrid,
  AlertCircle,
  Zap,
} from "lucide-react";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

const CATEGORY_CONFIG: Record<Category, { label: string; color: string; bg: string }> = {
  all: { label: "Tất cả", color: "text-slate-300", bg: "bg-slate-700/60" },
  ai: { label: "AI", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  cloud: { label: "Cloud", color: "text-sky-400", bg: "bg-sky-500/15" },
  startup: { label: "Startup", color: "text-violet-400", bg: "bg-violet-500/15" },
};

function CategoryBadge({ category }: { category: Exclude<Category, "all"> }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 p-5 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/10 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={article.category} />
            <span className="text-xs text-slate-500">{article.source}</span>
          </div>
          <h2 className="text-sm font-semibold text-slate-100 leading-snug group-hover:text-white transition-colors line-clamp-2">
            {article.title}
          </h2>
        </div>
        <ExternalLink size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0 mt-1" />
      </div>
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{article.summary}</p>
      <div className="flex items-center gap-1 text-xs text-slate-600">
        <Clock size={11} />
        {timeAgo(article.publishedAt)}
      </div>
    </a>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-white/5 bg-white/[0.03] animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-5 w-12 rounded-full bg-white/10" />
        <div className="h-3 w-20 rounded bg-white/5" />
      </div>
      <div className="space-y-1.5">
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-4/5 rounded bg-white/10" />
      </div>
      <div className="space-y-1">
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-11/12 rounded bg-white/5" />
        <div className="h-3 w-3/4 rounded bg-white/5" />
      </div>
      <div className="h-3 w-20 rounded bg-white/5" />
    </div>
  );
}

export default function Home() {
  const [cache, setCache] = useState<NewsCache | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const loadNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("no_data");
      const data = await res.json();
      setCache(data);
      setError(null);
    } catch {
      setError("no_data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      await loadNews();
    } catch {
      setError("refresh_failed");
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = activeCategory === "all"
    ? cache?.articles ?? []
    : cache?.articles.filter((a) => a.category === activeCategory) ?? [];

  const counts = {
    all: cache?.articles.length ?? 0,
    ai: cache?.articles.filter((a) => a.category === "ai").length ?? 0,
    cloud: cache?.articles.filter((a) => a.category === "cloud").length ?? 0,
    startup: cache?.articles.filter((a) => a.category === "startup").length ?? 0,
  };

  const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
    all: <LayoutGrid size={14} />,
    ai: <Cpu size={14} />,
    cloud: <Cloud size={14} />,
    startup: <Rocket size={14} />,
  };

  return (
    <div className="min-h-screen bg-[#0a0c0f] text-slate-200">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 py-10">
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Live Feed</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">VN AI & Cloud Today</h1>
              <p className="mt-1 text-sm text-slate-500">Tin tức AI & Cloud tại Việt Nam trong 24 giờ qua — cập nhật mỗi giờ</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-white/10 hover:border-white/20 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Đang cập nhật..." : "Làm mới"}
              </button>
              {cache?.lastUpdated && (
                <span className="text-xs text-slate-600">Cập nhật {timeAgo(cache.lastUpdated)}</span>
              )}
            </div>
          </div>
        </header>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isActive
                    ? `${cfg.color} ${cfg.bg} border-current/30`
                    : "text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300"
                }`}
              >
                {CATEGORY_ICONS[cat]}
                {cfg.label}
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-white/10" : "bg-white/5"}`}>
                  {counts[cat]}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : error === "no_data" ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <AlertCircle size={32} className="text-slate-600" />
            <div>
              <p className="text-slate-400 font-medium">Chưa có dữ liệu</p>
              <p className="text-slate-600 text-sm mt-1">Nhấn nút bên dưới để tải tin tức lần đầu</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-40"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Đang tải..." : "Tải tin tức ngay"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <p className="text-slate-400">Không có tin tức nào cho danh mục này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((article) => <ArticleCard key={article.id} article={article} />)}
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-white/5 text-center text-xs text-slate-700">
          Powered by Tavily Search · Vercel KV · Next.js
        </footer>
      </div>
    </div>
  );
}
