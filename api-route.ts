// app/api/news/route.ts
// ---------------------
// API route: fetch tin từ RSS feeds → Claude summarize → trả về JSON
// Deploy trên Vercel, kết hợp với Vercel Cron để cache mỗi 6h

import { NextResponse } from "next/server";

// ============================================================
// CONFIG — Thêm/bỏ RSS feeds tùy ý
// ============================================================
const RSS_FEEDS = [
  {
    url: "https://vnexpress.net/rss/khoa-hoc-cong-nghe.rss",
    source: "VnExpress Tech",
  },
  {
    url: "https://ictnews.vn/feed",
    source: "ICT News",
  },
  {
    url: "https://www.thegioididong.com/tin-tuc/rss",
    source: "Thế Giới Di Động",
  },
  // Thêm GNews API nếu có key:
  // `https://gnews.io/api/v4/search?q=AI+cloud+Vietnam&lang=vi&token=${process.env.GNEWS_API_KEY}`
];

const KEYWORDS = [
  "AI", "cloud", "trí tuệ nhân tạo", "điện toán đám mây",
  "machine learning", "startup công nghệ", "VNG", "FPT", "VNPT",
  "CMC", "Zalo", "MoMo", "dữ liệu", "GPU", "LLM", "chatbot",
  "automation", "kubernetes", "devops", "SaaS", "fintech"
];

// ============================================================
// TYPES
// ============================================================
interface RawArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

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
// STEP 1: Fetch & parse RSS feeds
// ============================================================
async function fetchRSSFeed(feedUrl: string, sourceName: string): Promise<RawArticle[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "VNTechFeed/1.0" },
      next: { revalidate: 3600 }, // Next.js cache 1h
    });
    const xml = await res.text();

    // Simple XML parse — dùng regex cho nhẹ, không cần thư viện
    const items: RawArticle[] = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

    for (const match of itemMatches) {
      const block = match[1];
      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || "";
      const link = block.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const desc = block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[1] || "";

      // Filter: chỉ lấy bài trong 24h qua
      const published = new Date(pubDate);
      const isRecent = Date.now() - published.getTime() < 24 * 60 * 60 * 1000;

      // Filter: phải chứa keyword liên quan
      const content = `${title} ${desc}`.toLowerCase();
      const isRelevant = KEYWORDS.some((kw) => content.includes(kw.toLowerCase()));

      if (isRecent && isRelevant && title && link) {
        items.push({
          title: title.trim(),
          link,
          pubDate,
          description: desc.replace(/<[^>]*>/g, "").slice(0, 500), // strip HTML
          source: sourceName,
        });
      }
    }

    return items;
  } catch (err) {
    console.error(`RSS fetch failed for ${feedUrl}:`, err);
    return [];
  }
}

// ============================================================
// STEP 2: Claude API — summarize + categorize + tag
// ============================================================
async function summarizeWithClaude(articles: RawArticle[]): Promise<NewsItem[]> {
  if (articles.length === 0) return [];

  const prompt = `Bạn là trợ lý tổng hợp tin tức công nghệ Việt Nam.

Dưới đây là danh sách bài báo thô. Với mỗi bài, hãy:
1. Tóm tắt nội dung thành 2-3 câu bằng tiếng Việt, rõ ràng và súc tích
2. Phân loại vào 1 trong 4 category: "ai", "cloud", "startup", "enterprise"
3. Gắn 2-3 tags ngắn gọn (tên công ty, công nghệ, chủ đề)

Trả về JSON array theo format sau (không có markdown, chỉ JSON thuần):
[
  {
    "id": "1",
    "title": "...",
    "summary": "...",
    "source": "...",
    "url": "...",
    "publishedAt": "...",
    "category": "ai|cloud|startup|enterprise",
    "tags": ["tag1", "tag2"]
  }
]

Danh sách bài báo:
${articles
  .slice(0, 20) // giới hạn 20 bài/lần để tiết kiệm token
  .map(
    (a, i) => `[${i + 1}] Title: ${a.title}
Source: ${a.source}
URL: ${a.link}
Published: ${a.pubDate}
Content: ${a.description}`
  )
  .join("\n\n---\n\n")}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "[]";

  try {
    return JSON.parse(text);
  } catch {
    // Nếu parse fail, thử extract JSON từ response
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }
}

// ============================================================
// ROUTE HANDLER
// ============================================================
export async function GET() {
  try {
    // Fetch tất cả RSS feeds song song
    const allArticles = (
      await Promise.all(
        RSS_FEEDS.map((feed) => fetchRSSFeed(feed.url, feed.source))
      )
    ).flat();

    // Deduplicate by title similarity (simple check)
    const seen = new Set<string>();
    const unique = allArticles.filter((a) => {
      const key = a.title.slice(0, 30).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Summarize với Claude
    const newsItems = await summarizeWithClaude(unique);

    // Sort by publishedAt desc
    newsItems.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return NextResponse.json(
      { news: newsItems, total: newsItems.length, updatedAt: new Date().toISOString() },
      {
        headers: {
          // Cache 6h trên Vercel Edge
          "Cache-Control": "s-maxage=21600, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err) {
    console.error("News API error:", err);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
