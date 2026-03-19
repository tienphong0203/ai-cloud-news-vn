import { XMLParser } from 'fast-xml-parser';

export type Article = {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceDomain: string;
  summary: string;
  publishedAt: string;
  category: 'AI' | 'Cloud' | 'Startup' | 'General';
  imageUrl?: string;
};

// Google News RSS sources — searches Vietnamese AI/Cloud news
const RSS_SOURCES = [
  {
    url: 'https://news.google.com/rss/search?q=AI+trí+tuệ+nhân+tạo+Việt+Nam&hl=vi&gl=VN&ceid=VN:vi',
    category: 'AI' as const,
  },
  {
    url: 'https://news.google.com/rss/search?q=cloud+computing+Việt+Nam+điện+toán+đám+mây&hl=vi&gl=VN&ceid=VN:vi',
    category: 'Cloud' as const,
  },
  {
    url: 'https://news.google.com/rss/search?q=startup+công+nghệ+Việt+Nam+2024&hl=vi&gl=VN&ceid=VN:vi',
    category: 'Startup' as const,
  },
  {
    url: 'https://news.google.com/rss/search?q=FPT+Viettel+VNPT+technology+AI&hl=vi&gl=VN&ceid=VN:vi',
    category: 'General' as const,
  },
];

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

function extractSourceName(item: Record<string, string>, fallbackUrl: string): string {
  // Google News RSS embeds source in <source> tag
  if (item['source']) return item['source'];
  const domain = extractDomain(fallbackUrl);
  const knownSources: Record<string, string> = {
    'vnexpress.net': 'VnExpress',
    'tuoitre.vn': 'Tuổi Trẻ',
    'thanhnien.vn': 'Thanh Niên',
    'dantri.com.vn': 'Dân Trí',
    'baomoi.com': 'Báo Mới',
    'nhandan.vn': 'Nhân Dân',
    'vietnamnet.vn': 'VietnamNet',
    'cafef.vn': 'CafeF',
    'techcrunch.com': 'TechCrunch',
    'techinasia.com': 'Tech in Asia',
    'e27.co': 'e27',
    'dealstreetasia.com': 'DealStreetAsia',
  };
  return knownSources[domain] || domain;
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 40);
}

// Decode Google News redirect URLs
function decodeGoogleUrl(url: string): string {
  // Google News wraps actual URLs — return as-is, browser will redirect
  return url;
}

function isWithin24Hours(dateStr: string): boolean {
  try {
    const pub = new Date(dateStr).getTime();
    const now = Date.now();
    return now - pub < 24 * 60 * 60 * 1000;
  } catch {
    return true; // include if can't parse
  }
}

export async function fetchAllNews(): Promise<Article[]> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const allArticles: Article[] = [];
  const seenTitles = new Set<string>();

  await Promise.allSettled(
    RSS_SOURCES.map(async ({ url, category }) => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
          next: { revalidate: 0 },
        });
        if (!res.ok) return;

        const xml = await res.text();
        const parsed = parser.parse(xml);
        const items = parsed?.rss?.channel?.item ?? [];
        const itemList = Array.isArray(items) ? items : [items];

        for (const item of itemList) {
          const title: string = item.title ?? '';
          const link: string = item.link ?? item.guid ?? '';
          const pubDate: string = item.pubDate ?? new Date().toISOString();
          const description: string = item.description ?? '';

          if (!title || seenTitles.has(title)) continue;
          if (!isWithin24Hours(pubDate)) continue;

          seenTitles.add(title);

          // Clean HTML from description
          const cleanDesc = description
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim()
            .slice(0, 200);

          const sourceDomain = extractDomain(link);
          const sourceName = extractSourceName(item, link);

          allArticles.push({
            id: `${slugify(title)}-${Date.now()}`,
            title: title.replace(/ - [^-]+$/, ''), // strip source suffix Google adds
            url: decodeGoogleUrl(link),
            source: sourceName,
            sourceDomain,
            summary: cleanDesc || 'Xem bài viết đầy đủ tại nguồn.',
            publishedAt: pubDate,
            category,
            imageUrl: undefined,
          });
        }
      } catch (err) {
        console.error(`RSS fetch failed for ${url}:`, err);
      }
    })
  );

  // Sort by date descending
  allArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return allArticles.slice(0, 60); // cap at 60 articles
}
