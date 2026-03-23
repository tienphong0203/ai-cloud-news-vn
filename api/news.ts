import type { VercelRequest, VercelResponse } from "@vercel/node";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});


const decodeHtmlEntities = (text: string): string => {
  return text
    .replace(/&#(\d+);/g, (_: string, dec: string) => String.fromCharCode(parseInt(dec)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
};

const extractImageFromHtml = (html: string) => {
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = html.match(imgRegex);
  return match ? match[1] : null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const feeds = [
      { url: "https://vnexpress.net/rss/so-hoa.rss", source: "VnExpress", region: "Vietnam" },
      { url: "https://vnexpress.net/rss/kinh-doanh.rss", source: "VnExpress", region: "Vietnam" },
      { url: "https://vnexpress.net/rss/tin-moi-nhat.rss", source: "VnExpress", region: "Vietnam" },
      { url: "https://thanhnien.vn/rss/cong-nghe-game.rss", source: "Thanh Niên", region: "Vietnam" },
      { url: "https://ictnews.vietnamnet.vn/rss/cong-nghe-thong-tin.rss", source: "ICTNews", region: "Vietnam" },
      { url: "https://ictnews.vietnamnet.vn/rss/chuyen-doi-so.rss", source: "ICTNews", region: "Vietnam" },
      { url: "https://vneconomy.vn/cong-nghe.rss", source: "VnEconomy", region: "Vietnam" },
      { url: "https://tuoitre.vn/rss/cong-nghe.rss", source: "Tuổi Trẻ", region: "Vietnam" },
      { url: "https://baochinhphu.vn/rss/khoa-hoc-cong-nghe.rss", source: "Báo Chính Phủ", region: "Vietnam" },
      { url: "https://vtv.vn/rss/cong-nghe.rss", source: "VTV News", region: "Vietnam" },
      { url: "https://baotintuc.vn/rss/kinh-te.rss", source: "Báo Tin Tức", region: "Vietnam" },
      { url: "https://vietnamnet.vn/rss/cong-nghe.rss", source: "VietnamNet", region: "Vietnam" },
      { url: "https://techcrunch.com/category/artificial-intelligence/feed/", source: "TechCrunch", region: "USA" },
      { url: "https://www.theverge.com/rss/index.xml", source: "The Verge", region: "USA" },
      { url: "https://www.scmp.com/rss/91/feed", source: "SCMP", region: "China" },
      { url: "https://www.chinadaily.com.cn/rss/bizchina/tech.xml", source: "China Daily", region: "China" },
      { url: "http://feeds.bbci.co.uk/news/technology/rss.xml", source: "BBC News", region: "Europe" },
      { url: "https://www.reutersagency.com/feed/?best-topics=technology&post_type=best", source: "Reuters", region: "Europe" },
    ];

    const keywords = [
      /\bAI\b/i,
      /\bARTIFICIAL INTELLIGENCE\b/i,
      /\bCHUYỂN ĐỔI SỐ\b/i,
      /\bDIGITAL TRANSFORMATION\b/i,
      /\bCLOUD\b/i,
      /\bDATA CENTER\b/i,
      /\bDATACENTER\b/i,
      /\bGENAI\b/i,
      /\bLLM\b/i,
      /\bMACHINE LEARNING\b/i,
      /\bTRÍ TUỆ NHÂN TẠO\b/i,
      /\bCÔNG NGHỆ SỐ\b/i,
      /\bHẠ TẦNG SỐ\b/i,
      /\bKINH TẾ SỐ\b/i,
      /\bFPT\b/i,
      /\bVIETTEL\b/i,
      /\bCMC\b/i,
      /\bMOBIFONE\b/i,
      /\bVINAPHONE\b/i,
      /\bVNPT\b/i,
      /\bVNG\b/i,
      /\bMISA\b/i,
      /\bGPU\b/i,
      /\bBÁN DẪN\b/i,
      /\bSEMICONDUCTOR\b/i,
    ];

    const negativeKeywords = [
      // Conflict / crime
      /\bCHIẾN SỰ\b/i,
      /\bXUNG ĐỘT\b/i,
      /\bWAR\b/i,
      /\bCONFLICT\b/i,
      /\bCRIME\b/i,
      /\bTỘI PHẠM\b/i,
      /\bTAI NẠN\b/i,
      /\bACCIDENT\b/i,
      /\bHÌNH SỰ\b/i,
      /\bCHÁY NỔ\b/i,
      // Entertainment / sports
      /\bTHỂ THAO\b/i,
      /\bBÓNG ĐÁ\b/i,
      /\bSHOWBIZ\b/i,
      /\bGIẢI TRÍ\b/i,
      // Weather
      /\bHUMIDITY\b/i,
      /\bWEATHER\b/i,
      /\bTHỜI TIẾT\b/i,
      /\bRAINFALL\b/i,
      /\bTYPHOON\b/i,
      /\bBÃO\b/i,
      // Real estate / finance unrelated
      /\bPROPERTY MARKET\b/i,
      /\bREAL ESTATE\b/i,
      /\bBẤT ĐỘNG SẢN\b/i,
      /\bMORTGAGE\b/i,
      /\bINTEREST RATE CUT\b/i,
      // Shopping / deals
      /\bBIG SPRING SALE\b/i,
      /\bBLACK FRIDAY\b/i,
      /\bPRIME DAY\b/i,
      /\bBEST DEALS\b/i,
      /\bMUA SẮM\b/i,
    ];

    const now = new Date();
    const timeWindow = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const results = await Promise.allSettled(feeds.map((f) => parser.parseURL(f.url)));

    const allItems: any[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const feedData = result.value;
        const feedInfo = feeds[index];

        feedData.items.forEach((item: any) => {
          const pubDate = new Date(item.pubDate || "");
          const title = decodeHtmlEntities(item.title || "");
          const content = decodeHtmlEntities(item.contentSnippet || item.content || "");
          const fullContent = item.contentEncoded || item.content || "";

          if (pubDate < timeWindow) return;

          const textToSearch = title + " " + content;

          const isNegative = negativeKeywords.some((regex) => regex.test(textToSearch));
          if (isNegative) return;

          const matchesKeyword = keywords.some((regex) => regex.test(textToSearch));

          if (matchesKeyword) {
            let thumbnail = null;
            if (item.enclosure && item.enclosure.url) {
              thumbnail = item.enclosure.url;
            } else if (item.mediaContent && item.mediaContent[0] && item.mediaContent[0].$) {
              thumbnail = item.mediaContent[0].$.url;
            } else if (item.mediaThumbnail && item.mediaThumbnail.$) {
              thumbnail = item.mediaThumbnail.$.url;
            } else {
              thumbnail = extractImageFromHtml(fullContent);
            }

            allItems.push({
              id: item.guid || item.link,
              source: feedInfo.source,
              region: feedInfo.region,
              title,
              link: item.link,
              pubDate: item.pubDate,
              content,
              thumbnail,
              tag: feedInfo.region,
            });
          }
        });
      }
    });

    allItems.sort((a, b) => new Date(b.pubDate!).getTime() - new Date(a.pubDate!).getTime());

    // Prevent Vercel CDN from caching — always fetch fresh RSS
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    return res.status(200).json(allItems);
  } catch (error) {
    console.error("Error fetching RSS:", error);
    return res.status(500).json({ error: "Failed to fetch news" });
  }
}
