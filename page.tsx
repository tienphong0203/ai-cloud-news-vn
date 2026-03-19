"use client";

import { useState, useEffect } from "react";

// ============================================================
// TYPES
// ============================================================
interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: "ai" | "cloud" | "startup" | "enterprise";
  tags: string[];
}

// ============================================================
// MOCK DATA — thay bằng API call thật từ /api/news
// ============================================================
const MOCK_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "VNG Cloud công bố mở rộng hạ tầng GPU cho AI workloads",
    summary:
      "VNG Cloud vừa thông báo nâng cấp cụm máy chủ GPU H100 tại data center TP.HCM, hướng tới phục vụ các doanh nghiệp đang triển khai mô hình AI generative tại thị trường Việt Nam.",
    source: "VnExpress Tech",
    url: "#",
    publishedAt: "2025-03-19T08:30:00Z",
    category: "cloud",
    tags: ["VNG Cloud", "GPU", "AI Infrastructure"],
  },
  {
    id: "2",
    title: "FPT AI ra mắt nền tảng RAG dành cho doanh nghiệp vừa và nhỏ",
    summary:
      "FPT Software giới thiệu bộ giải pháp AI gồm RAG pipeline, vector database, và orchestration layer — được tối ưu cho tài liệu tiếng Việt với độ chính xác cải thiện 34% so với thế hệ trước.",
    source: "Báo Đầu Tư",
    url: "#",
    publishedAt: "2025-03-19T07:15:00Z",
    category: "ai",
    tags: ["FPT", "RAG", "LLM", "SME"],
  },
  {
    id: "3",
    title: "Startup AI Việt gọi vốn $5M Series A từ quỹ Đông Nam Á",
    summary:
      "Một startup AI tập trung vào tự động hóa quy trình kế toán vừa hoàn tất vòng Series A, với sự dẫn đầu của quỹ đầu tư mạo hiểm khu vực. Công ty hiện phục vụ hơn 200 doanh nghiệp tại Việt Nam.",
    source: "TechInAsia",
    url: "#",
    publishedAt: "2025-03-19T06:00:00Z",
    category: "startup",
    tags: ["Startup", "Funding", "AI Automation"],
  },
  {
    id: "4",
    title: "VNPT và Microsoft ký kết hợp tác chiến lược về Azure Cloud",
    summary:
      "VNPT và Microsoft Việt Nam công bố thỏa thuận hợp tác 3 năm, tập trung vào triển khai Azure Government Cloud cho khối cơ quan nhà nước và doanh nghiệp nhà nước tại Việt Nam.",
    source: "ICT News",
    url: "#",
    publishedAt: "2025-03-18T22:00:00Z",
    category: "enterprise",
    tags: ["VNPT", "Microsoft Azure", "Government Cloud"],
  },
  {
    id: "5",
    title: "CMC Cloud triển khai Kubernetes-as-a-Service cho thị trường mid-market",
    summary:
      "CMC Technology ra mắt dịch vụ managed Kubernetes mới, hỗ trợ multi-cluster và GitOps workflow, nhắm vào phân khúc doanh nghiệp vừa đang trong lộ trình container hóa ứng dụng.",
    source: "PC World VN",
    url: "#",
    publishedAt: "2025-03-18T20:30:00Z",
    category: "cloud",
    tags: ["CMC Cloud", "Kubernetes", "DevOps"],
  },
  {
    id: "6",
    title: "Zalo AI cập nhật model nhận dạng giọng nói tiếng Việt đạt WER 4.2%",
    summary:
      "Nhóm nghiên cứu ZaloAI công bố kết quả mới nhất trên benchmark tiếng Việt với Word Error Rate 4.2%, vượt qua các model đa ngôn ngữ như Whisper large-v3 trên tập dữ liệu hội thoại thực tế.",
    source: "VnReview",
    url: "#",
    publishedAt: "2025-03-18T18:00:00Z",
    category: "ai",
    tags: ["ZaloAI", "Speech Recognition", "NLP"],
  },
];

// ============================================================
// HELPERS
// ============================================================
const CATEGORY_CONFIG = {
  ai: { label: "AI & ML", color: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  cloud: { label: "Cloud", color: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  startup: { label: "Startup", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  enterprise: { label: "Enterprise", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000 / 60;
  if (diff < 60) return `${Math.round(diff)}p trước`;
  if (diff < 1440) return `${Math.round(diff / 60)}h trước`;
  return `${Math.round(diff / 1440)}d trước`;
}

// ============================================================
// COMPONENTS
// ============================================================
function CategoryBadge({ category }: { category: NewsItem["category"] }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function NewsCard({ item, featured }: { item: NewsItem; featured?: boolean }) {
  return (
    <a
      href={item.url}
      className={`group block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 hover:bg-zinc-800/60 transition-all duration-200 ${
        featured ? "col-span-2 md:col-span-2" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <CategoryBadge category={item.category} />
        <span className="text-zinc-500 text-xs ml-auto">{timeAgo(item.publishedAt)}</span>
      </div>

      <h2 className={`font-semibold text-zinc-100 leading-snug group-hover:text-white transition-colors ${featured ? "text-lg mb-3" : "text-sm mb-2"}`}>
        {item.title}
      </h2>

      <p className={`text-zinc-400 leading-relaxed ${featured ? "text-sm" : "text-xs line-clamp-3"}`}>
        {item.summary}
      </p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
        <span className="text-zinc-500 text-xs font-medium">{item.source}</span>
        <div className="flex gap-1 flex-wrap justify-end">
          {item.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
              #{tag.replace(/\s/g, "")}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-zinc-500 text-xs mt-0.5">{label}</div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function VNTechNewsPage() {
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const categories = ["all", "ai", "cloud", "startup", "enterprise"];

  const filtered =
    activeCategory === "all"
      ? news
      : news.filter((n) => n.category === activeCategory);

  const handleRefresh = async () => {
    setLoading(true);
    // TODO: fetch("/api/news").then(r => r.json()).then(setNews)
    await new Promise((r) => setTimeout(r, 1200));
    setLastUpdated(new Date());
    setLoading(false);
  };

  const counts = {
    ai: news.filter((n) => n.category === "ai").length,
    cloud: news.filter((n) => n.category === "cloud").length,
    startup: news.filter((n) => n.category === "startup").length,
    enterprise: news.filter((n) => n.category === "enterprise").length,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* HEADER */}
      <header className="border-b border-zinc-800 sticky top-0 z-50 bg-zinc-950/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="font-bold text-sm tracking-tight">VN.TECH.FEED</span>
            <span className="text-zinc-600 text-xs hidden sm:block">/ AI & Cloud Việt Nam</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-500 text-xs hidden sm:block">
              {lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-xs border border-zinc-700 rounded-lg px-3 py-1.5 hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-40"
            >
              {loading ? "Đang tải..." : "↻ Làm mới"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* STATS ROW */}
        <div className="grid grid-cols-4 gap-4 mb-8 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <StatPill label="AI & ML" value={counts.ai} />
          <StatPill label="Cloud" value={counts.cloud} />
          <StatPill label="Startup" value={counts.startup} />
          <StatPill label="Enterprise" value={counts.enterprise} />
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-medium px-4 py-2 rounded-lg border whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-white text-zinc-950 border-white"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              {cat === "all" ? "Tất cả" : CATEGORY_CONFIG[cat as NewsItem["category"]].label}
            </button>
          ))}
        </div>

        {/* NEWS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
                <div className="h-3 bg-zinc-800 rounded w-1/4 mb-3" />
                <div className="h-4 bg-zinc-800 rounded w-full mb-2" />
                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-4" />
                <div className="h-3 bg-zinc-800 rounded w-full mb-1" />
                <div className="h-3 bg-zinc-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item, idx) => (
              <NewsCard key={item.id} item={item} featured={idx === 0 && activeCategory === "all"} />
            ))}
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-12 pt-6 border-t border-zinc-800 text-center text-zinc-600 text-xs">
          <p>Cập nhật tự động mỗi 6 giờ · Nguồn: VnExpress, ICT News, TechInAsia, VnReview</p>
          <p className="mt-1">Powered by Claude API · Built for GreenNode PM team</p>
        </footer>
      </main>
    </div>
  );
}
