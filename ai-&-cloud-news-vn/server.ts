import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Parser from "rss-parser";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;
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

  app.use(cors());
  app.use(express.json());

  // Helper to extract image from HTML string
  const extractImageFromHtml = (html: string) => {
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const match = html.match(imgRegex);
    return match ? match[1] : null;
  };

  // API Route to fetch RSS feeds
  app.get("/api/news", async (req, res) => {
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
        { url: "https://www.reutersagency.com/feed/?best-topics=technology&post_type=best", source: "Reuters", region: "Europe" }
      ];

      const results = await Promise.allSettled(feeds.map(f => parser.parseURL(f.url)));
      
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
        /\bSEMICONDUCTOR\b/i
      ];

      const negativeKeywords = [
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
        /\bTHỂ THAO\b/i,
        /\bBÓNG ĐÁ\b/i,
        /\bSHOWBIZ\b/i,
        /\bGIẢI TRÍ\b/i
      ];

      const now = new Date();
      const timeWindow = new Date(now.getTime() - 48 * 60 * 60 * 1000); 

      const allItems: any[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const feedData = result.value;
          const feedInfo = feeds[index];

          feedData.items.forEach((item: any) => {
            const pubDate = new Date(item.pubDate || "");
            const title = item.title || "";
            const content = item.contentSnippet || item.content || "";
            const fullContent = item.contentEncoded || item.content || "";
            
            // Filter by time window
            if (pubDate < timeWindow) return;

            const textToSearch = title + " " + content;
            
            // Check negative keywords first
            const isNegative = negativeKeywords.some(regex => regex.test(textToSearch));
            if (isNegative) return;

            // Filter by positive keywords
            const matchesKeyword = keywords.some(regex => regex.test(textToSearch));
            
            if (matchesKeyword) {
              // Extract thumbnail
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
                title: title,
                link: item.link,
                pubDate: item.pubDate,
                content: content,
                thumbnail: thumbnail,
                tag: feedInfo.region
              });
            }
          });
        }
      });

      // Sort by date descending
      allItems.sort((a, b) => new Date(b.pubDate!).getTime() - new Date(a.pubDate!).getTime());

      res.json(allItems);
    } catch (error) {
      console.error("Error fetching RSS:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
