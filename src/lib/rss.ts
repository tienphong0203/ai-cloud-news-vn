import Parser from 'rss-parser';

export interface NewsItem {
  id: string;
  source: string;
  region: string;
  title: string;
  link: string;
  pubDate: string;
  content: string;
  thumbnail: string | null;
  tag: string;
  isCompetitor: boolean;
  competitorName: string | null;
}

// ── RSS Feed Sources ──────────────────────────────────────────────
const FEEDS = [
  // Vietnam
  { url: 'https://vnexpress.net/rss/so-hoa.rss', source: 'VnExpress', region: 'Vietnam' },
  { url: 'https://vnexpress.net/rss/kinh-doanh.rss', source: 'VnExpress', region: 'Vietnam' },
  { url: 'https://vnexpress.net/rss/tin-moi-nhat.rss', source: 'VnExpress', region: 'Vietnam' },
  { url: 'https://thanhnien.vn/rss/cong-nghe-game.rss', source: 'Thanh Niên', region: 'Vietnam' },
  { url: 'https://ictnews.vietnamnet.vn/rss/cong-nghe-thong-tin.rss', source: 'ICTNews', region: 'Vietnam' },
  { url: 'https://ictnews.vietnamnet.vn/rss/chuyen-doi-so.rss', source: 'ICTNews', region: 'Vietnam' },
  { url: 'https://vneconomy.vn/cong-nghe.rss', source: 'VnEconomy', region: 'Vietnam' },
  { url: 'https://tuoitre.vn/rss/cong-nghe.rss', source: 'Tuổi Trẻ', region: 'Vietnam' },
  { url: 'https://baochinhphu.vn/rss/khoa-hoc-cong-nghe.rss', source: 'Báo Chính Phủ', region: 'Vietnam' },
  { url: 'https://vtv.vn/rss/cong-nghe.rss', source: 'VTV News', region: 'Vietnam' },
  { url: 'https://baotintuc.vn/rss/kinh-te.rss', source: 'Báo Tin Tức', region: 'Vietnam' },
  { url: 'https://vietnamnet.vn/rss/cong-nghe.rss', source: 'VietnamNet', region: 'Vietnam' },
  // USA
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch', region: 'USA' },
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', region: 'USA' },
  // China
  { url: 'https://www.scmp.com/rss/91/feed', source: 'SCMP', region: 'China' },
  { url: 'https://www.chinadaily.com.cn/rss/bizchina/tech.xml', source: 'China Daily', region: 'China' },
  // Europe
  { url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', source: 'BBC News', region: 'Europe' },
  { url: 'https://www.reutersagency.com/feed/?best-topics=technology&post_type=best', source: 'Reuters', region: 'Europe' },
];

// ── Keyword filters ───────────────────────────────────────────────
const POSITIVE_KEYWORDS = [
  /\bAI\b/i, /\bARTIFICIAL INTELLIGENCE\b/i, /\bCHUYỂN ĐỔI SỐ\b/i,
  /\bDIGITAL TRANSFORMATION\b/i, /\bCLOUD\b/i, /\bDATA CENTER\b/i,
  /\bDATACENTER\b/i, /\bGENAI\b/i, /\bLLM\b/i, /\bMACHINE LEARNING\b/i,
  /\bTRÍ TUỆ NHÂN TẠO\b/i, /\bCÔNG NGHỆ SỐ\b/i, /\bHẠ TẦNG SỐ\b/i,
  /\bKINH TẾ SỐ\b/i, /\bFPT\b/i, /\bVIETTEL\b/i, /\bCMC\b/i,
  /\bMOBIFONE\b/i, /\bVINAPHONE\b/i, /\bVNPT\b/i, /\bVNG\b/i, /\bMISA\b/i,
  /\bGPU\b/i, /\bBÁN DẪN\b/i, /\bSEMICONDUCTOR\b/i,
];

const NEGATIVE_KEYWORDS = [
  /\bCHIẾN SỰ\b/i, /\bXUNG ĐỘT\b/i, /\bWAR\b/i, /\bCONFLICT\b/i,
  /\bCRIME\b/i, /\bTỘI PHẠM\b/i, /\bTAI NẠN\b/i, /\bACCIDENT\b/i,
  /\bHÌNH SỰ\b/i, /\bCHÁY NỔ\b/i, /\bTHỂ THAO\b/i, /\bBÓNG ĐÁ\b/i,
  /\bSHOWBIZ\b/i, /\bGIẢI TRÍ\b/i,
];

const COMPETITORS: Record<string, RegExp> = {
  FPT: /\bFPT\b/i,
  VIETTEL: /\bVIETTEL\b/i,
  CMC: /\bCMC\b/i,
  VNPT: /\bVNPT\b/i,
  VNG: /\bVNG\b/i,
  MOBIFONE: /\bMOBIFONE\b/i,
  MISA: /\bMISA\b/i,
};

// ── Helper: extract image from HTML ───────────────────────────────
function extractImageFromHtml(html: string): string | null {
  const match = html.match(/<img[^>]+src="([^">]+)"/i);
  return match ? match[1] : null;
}

function detectCompetitor(text: string): string | null {
  for (const [name, regex] of Object.entries(COMPETITORS)) {
    if (regex.test(text)) return name;
  }
  return null;
}

// ── Main fetch function ───────────────────────────────────────────
export async function fetchAllNews(): Promise<NewsItem[]> {
  const parser = new Parser({
    customFields: {
      item: [
        ['media:content', 'mediaContent', { keepArray: true }],
        ['media:thumbnail', 'mediaThumbnail'],
        ['enclosure', 'enclosure'],
        ['content:encoded', 'contentEncoded'],
      ],
    },
  });

  const timeWindow = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const results = await Promise.allSettled(FEEDS.map(f => parser.parseURL(f.url)));
  const allItems: NewsItem[] = [];
  const seenTitles = new Set<string>();

  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const feedInfo = FEEDS[index];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.value.items.forEach((item: any) => {
      const pubDate = new Date(item.pubDate || '');
      const title: string = item.title || '';
      const content: string = item.contentSnippet || item.content || '';
      const fullContent: string = item.contentEncoded || item.content || '';

      if (pubDate < timeWindow) return;
      if (!title || seenTitles.has(title)) return;

      const textToSearch = title + ' ' + content;

      // Skip negative topics
      if (NEGATIVE_KEYWORDS.some(r => r.test(textToSearch))) return;

      // Must match at least one positive keyword
      if (!POSITIVE_KEYWORDS.some(r => r.test(textToSearch))) return;

      seenTitles.add(title);

      // Extract thumbnail
      let thumbnail: string | null = null;
      if (item.enclosure?.url) {
        thumbnail = item.enclosure.url;
      } else if (item.mediaContent?.[0]?.$?.url) {
        thumbnail = item.mediaContent[0].$.url;
      } else if (item.mediaThumbnail?.$?.url) {
        thumbnail = item.mediaThumbnail.$.url;
      } else {
        thumbnail = extractImageFromHtml(fullContent);
      }

      const competitorName = detectCompetitor(textToSearch);

      allItems.push({
        id: item.guid || item.link || `${feedInfo.source}-${Date.now()}-${Math.random()}`,
        source: feedInfo.source,
        region: feedInfo.region,
        title,
        link: item.link || '',
        pubDate: item.pubDate || new Date().toISOString(),
        content: content.replace(/<[^>]+>/g, '').slice(0, 300),
        thumbnail,
        tag: feedInfo.region,
        isCompetitor: !!competitorName,
        competitorName,
      });
    });
  });

  // Sort newest first
  allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return allItems;
}
