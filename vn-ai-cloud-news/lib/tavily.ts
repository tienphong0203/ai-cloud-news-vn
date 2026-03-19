import { Article, Category } from "./types";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY!;
const TAVILY_URL = "https://api.tavily.com/search";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
}

interface QueryConfig {
  query: string;
  category: Exclude<Category, "all">;
}

const QUERIES: QueryConfig[] = [
  // AI
  { query: "AI trí tuệ nhân tạo Việt Nam 24 giờ qua", category: "ai" },
  { query: "Vietnam artificial intelligence startup news", category: "ai" },
  { query: "ChatGPT Gemini AI ứng dụng Việt Nam mới nhất", category: "ai" },
  // Cloud
  { query: "cloud computing Việt Nam Viettel FPT cloud mới nhất", category: "cloud" },
  { query: "Vietnam cloud infrastructure data center news", category: "cloud" },
  // Startup
  { query: "startup công nghệ Việt Nam gọi vốn 2025", category: "startup" },
  { query: "Vietnam tech company funding announcement", category: "startup" },
];

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const domainMap: Record<string, string> = {
      "vnexpress.net": "VnExpress",
      "thanhnien.vn": "Thanh Niên",
      "tuoitre.vn": "Tuổi Trẻ",
      "vietnamnet.vn": "VietnamNet",
      "techcrunch.com": "TechCrunch",
      "techinasia.com": "Tech in Asia",
      "e27.co": "e27",
      "nikkei.com": "Nikkei Asia",
      "reuters.com": "Reuters",
      "theverge.com": "The Verge",
      "bloomberg.com": "Bloomberg",
      "baomoi.com": "Báo Mới",
      "cafef.vn": "CafeF",
      "vir.com.vn": "Vietnam Investment Review",
      "dantri.com.vn": "Dân Trí",
    };
    return domainMap[hostname] || hostname;
  } catch {
    return "Unknown";
  }
}

function generateId(url: string): string {
  return Buffer.from(url).toString("base64").slice(0, 16);
}

async function searchTavily(query: string): Promise<TavilyResult[]> {
  const res = await fetch(TAVILY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      search_depth: "basic",
      max_results: 5,
      days: 1, // last 24h
      include_answer: false,
    }),
  });

  if (!res.ok) {
    console.error(`Tavily error for query "${query}":`, res.status);
    return [];
  }

  const data = await res.json();
  return data.results || [];
}

export async function fetchAllNews(): Promise<Article[]> {
  const seenUrls = new Set<string>();
  const articles: Article[] = [];

  const results = await Promise.allSettled(
    QUERIES.map(async ({ query, category }) => {
      const items = await searchTavily(query);
      return { items, category };
    })
  );

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { items, category } = result.value;

    for (const item of items) {
      if (seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);

      articles.push({
        id: generateId(item.url),
        title: item.title,
        url: item.url,
        source: extractDomain(item.url),
        summary: item.content?.slice(0, 200) + "..." || "",
        publishedAt: item.published_date || new Date().toISOString(),
        category,
      });
    }
  }

  // Sort newest first
  return articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
