'use client';

import type { Article } from '@/lib/news';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

const CATEGORY_LABELS: Record<string, string> = {
  AI: 'Trí tuệ nhân tạo',
  Cloud: 'Cloud',
  Startup: 'Startup',
  General: 'Công nghệ',
};

export default function NewsCard({ article, index }: { article: Article; index: number }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`news-card stagger-item block bg-[#161B22] border border-[#21262D] rounded-xl p-5 cursor-pointer`}
      style={{ animationDelay: `${Math.min(index * 0.06, 0.5)}s` }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <span
          className={`badge-${article.category} text-[10px] font-mono font-medium uppercase tracking-widest px-2 py-0.5 rounded border`}
        >
          {CATEGORY_LABELS[article.category] ?? article.category}
        </span>
        <span className="text-[11px] text-[#8B949E] font-mono shrink-0">
          {timeAgo(article.publishedAt)}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-[15px] font-semibold leading-snug text-[#E6EDF3] mb-2 line-clamp-2 group-hover:text-accent">
        {article.title}
      </h2>

      {/* Summary */}
      {article.summary && article.summary !== 'Xem bài viết đầy đủ tại nguồn.' && (
        <p className="text-[13px] text-[#8B949E] leading-relaxed line-clamp-2 mb-3">
          {article.summary}
        </p>
      )}

      {/* Source */}
      <div className="flex items-center gap-1.5 mt-auto pt-1">
        {/* Favicon */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${article.sourceDomain}&sz=16`}
          alt=""
          width={14}
          height={14}
          className="rounded-sm opacity-70"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <span className="text-[11px] text-[#8B949E] font-mono">{article.source}</span>
        <span className="ml-auto text-[#30363D]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </a>
  );
}
