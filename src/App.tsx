/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import Navbar from "./components/Navbar";
import { Clock, Zap, ShieldAlert, ChevronRight, Loader2 } from "lucide-react";
import { GoogleGenAI } from "@google/genai";

interface NewsItem {
  id: string;
  source: string;
  region: string;
  title: string;
  link: string;
  pubDate: string;
  content: string;
  tag: string;
  summary?: string;
  thumbnail?: string;
  curatedTitle?: string;
  curatedSummary?: string;
  isCompetitor?: boolean;
  competitorName?: string | null;
}

interface CompetitorAction {
  id: string;
  name: string;
  action: string;
  time: string;
  link?: string;
}

export default function App() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("light");
  };

  const notifications = [
    { id: 1, text: "Gemini vừa tóm tắt bản tin mới nhất cho bạn.", time: "Vừa xong" },
    { id: 2, text: "Phát hiện hoạt động mới từ đối thủ Viettel.", time: "10 phút trước" },
    { id: 3, text: "Chào mừng bạn đến với GenNews!", time: "1 giờ trước" },
  ];

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" }), []);

  const getNewsData = async () => {
    setLoading(true);
    try {
      const response = await window.fetch("/api/news");
      const data: NewsItem[] = await response.json();
      
      setNews(data);
      
      // Curate news with Gemini
      if (data.length > 0) {
        curateNewsWithGemini(data.slice(0, 30)); // Curate top 30 for quality
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const curateNewsWithGemini = async (items: NewsItem[]) => {
    setSummarizing(true);
    try {
      const itemsToCurate = items.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content.slice(0, 500) // Limit content length
      }));
      
      const prompt = `Bạn là một Biên tập viên Công nghệ cao cấp. Hãy biên tập danh sách tin tức sau:
      1. Dịch tiêu đề và nội dung sang tiếng Việt nếu chúng là tiếng nước ngoài.
      2. Chỉ giữ lại những bài liên quan đến: AI, Cloud, Datacenter, Chuyển đổi số, GPU, Bán dẫn. 
      3. Tóm tắt nội dung mỗi bài thành tối đa 2 câu súc tích.
      4. Xác định xem bài báo có nhắc đến các đối thủ: FPT, Viettel, CMC, Vinaphone, VNG hay không.

      Trả về kết quả dưới dạng JSON array, mỗi object có:
      - id: (string, giữ nguyên id gốc)
      - title: (string, tiêu đề đã dịch/biên tập)
      - summary: (string, tóm tắt 2 câu)
      - isRelevant: (boolean, true nếu thuộc các keyword yêu cầu)
      - competitor: (string hoặc null, tên đối thủ nếu có nhắc đến)

      Danh sách tin:
      ${JSON.stringify(itemsToCurate)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const curatedResults = JSON.parse(response.text || "[]");
      
      setNews(prev => {
        const updated = [...prev];
        curatedResults.forEach((curated: any) => {
          const index = updated.findIndex(n => n.id === curated.id);
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              curatedTitle: curated.title,
              curatedSummary: curated.summary,
              isCompetitor: !!curated.competitor,
              competitorName: curated.competitor,
              // If not relevant, we might want to hide it, but for now let's just mark it
              tag: curated.isRelevant ? updated[index].tag : "Khác"
            };
          }
        });
        
        // Filter out non-relevant news if Gemini says so
        return updated.filter(n => {
          const curated = curatedResults.find((c: any) => c.id === n.id);
          if (curated) return curated.isRelevant;
          return true; // Keep others for now
        });
      });

      // Generate a global summary for the highlight
      const globalPrompt = `Dựa trên các tin tức sau, hãy viết một câu tóm tắt xu hướng công nghệ chính trong 24h qua (tiếng Việt):
      ${curatedResults.map((c: any) => c.title).join("; ")}`;

      const globalResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: globalPrompt }] }],
      });

      const globalSummary = globalResponse.text || "";
      setNews(prev => prev.map((item, idx) => idx === 0 ? { ...item, summary: globalSummary } : item));

    } catch (error) {
      console.error("Gemini curation error:", error);
    } finally {
      setSummarizing(false);
    }
  };

  useEffect(() => {
    getNewsData();
  }, []);

  // Filter news based on selected category (Region)
  const filteredNews = useMemo(() => {
    if (selectedCategory === "Tất cả") return news;
    return news.filter(item => 
      item.region === selectedCategory || item.tag === selectedCategory
    );
  }, [news, selectedCategory]);

  // Detect competitors: FPT, Viettel, CMC, Mobifone, Vinaphone, VNPT
  const competitorRadar = useMemo(() => {
    const competitors: CompetitorAction[] = [];
    
    news.forEach(item => {
      if (item.isCompetitor && item.competitorName) {
        competitors.push({
          id: item.id,
          name: item.competitorName.toUpperCase(),
          action: item.curatedTitle || item.title,
          time: new Date(item.pubDate).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " hôm nay",
          link: item.link
        });
      }
    });

    // If no real competitor news, show mock data as requested
    if (competitors.length === 0) {
      return [
        {
          id: "mock-1",
          name: "VIETTEL",
          action: "Viettel công bố chiến lược phát triển hạ tầng Data Center xanh tại Việt Nam.",
          time: "08:30 hôm nay",
          link: "#"
        },
        {
          id: "mock-2",
          name: "FPT",
          action: "FPT Software ký kết hợp tác chiến lược về AI với đối tác Nhật Bản.",
          time: "10:15 hôm nay",
          link: "#"
        }
      ];
    }
    return competitors.slice(0, 5);
  }, [news]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) return "Vừa xong";
    if (diffHrs < 24) return `${diffHrs} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className={`min-h-screen bg-background font-sans transition-colors duration-300 pb-12 ${isDarkMode ? "" : "light"}`}>
      <Navbar 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
        notificationCount={notifications.length}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
      
      {/* Notification Panel */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-80 bg-gn-darkGray border border-gn-borderColor rounded-lg shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gn-borderColor flex justify-between items-center bg-gn-borderColor/20">
            <h3 className="font-bold text-sm uppercase tracking-wider">Thông báo</h3>
            <button onClick={() => setShowNotifications(false)} className="text-gn-textMuted hover:text-foreground text-xs">Đóng</button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map(n => (
              <div key={n.id} className="p-4 border-b border-gn-borderColor/50 hover:bg-gn-borderColor/10 cursor-pointer transition-colors">
                <p className="text-sm text-foreground mb-1">{n.text}</p>
                <span className="text-[10px] text-gn-textMuted">{n.time}</span>
              </div>
            ))}
          </div>
          <div className="p-3 text-center bg-gn-borderColor/10">
            <button className="text-xs text-gn-green font-medium hover:underline">Xem tất cả thông báo</button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 mt-8">
        
        {/* DAILY SUMMARY (GEMINI) */}
        {summarizing && (
          <div className="mb-8 p-4 bg-gn-darkGray border border-gn-green/30 rounded-lg animate-pulse flex items-center gap-3">
            <Loader2 className="animate-spin text-gn-green" size={20} />
            <span className="text-sm text-gn-green font-medium">Gemini đang tóm tắt bản tin 24h...</span>
          </div>
        )}
        
        {!summarizing && filteredNews[0]?.summary && (
          <div className="mb-8 p-6 bg-gn-darkGray border-l-4 border-gn-green rounded-r-lg shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-gn-green" size={18} />
              <span className="text-xs font-bold uppercase tracking-widest text-gn-green">Tóm tắt 24h (AI Generated)</span>
            </div>
            <p className="text-lg font-medium leading-relaxed text-foreground italic">
              "{filteredNews[0].summary}"
            </p>
          </div>
        )}

        {/* SECTION 1: HOT NEWS */}
        <div className="mb-6 flex items-center gap-2 border-b border-gn-borderColor pb-2">
          <Zap className="text-gn-green" size={24} />
          <h2 className="text-xl font-bold uppercase tracking-wider text-foreground">
            {selectedCategory === "Tất cả" ? "Tin tức nổi bật (24h)" : `Tin tức ${selectedCategory}`}
          </h2>
        </div>

        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="animate-spin text-gn-green" size={48} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
              {/* Bài viết Hero */}
              {filteredNews[0] && (
                <div className="lg:col-span-7 relative group cursor-pointer overflow-hidden rounded-lg border border-gn-borderColor bg-gn-darkGray hover:border-gn-green transition-colors">
                  <a href={filteredNews[0].link} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={filteredNews[0].thumbnail || `https://picsum.photos/seed/${filteredNews[0].id.slice(-5)}/800/400`} 
                      alt="Hero" 
                      className="w-full h-[400px] object-cover opacity-60 group-hover:opacity-80 transition-opacity" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6">
                      <span className="inline-block px-3 py-1 mb-3 text-xs font-bold text-black bg-gn-green rounded-full">{filteredNews[0].tag}</span>
                      <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-gn-green transition-colors">
                        {filteredNews[0].curatedTitle || filteredNews[0].title}
                      </h3>
                      <div className="flex items-center text-gray-300 text-sm gap-2">
                        <Clock size={14} /> {formatTime(filteredNews[0].pubDate)} • {filteredNews[0].source}
                      </div>
                    </div>
                  </a>
                </div>
              )}

              {/* 4 Bài viết nhỏ bên phải */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredNews.slice(1, 5).map((item) => (
                  <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="flex flex-col rounded-lg border border-gn-borderColor bg-gn-darkGray overflow-hidden hover:border-gn-green/50 cursor-pointer transition-colors p-3">
                    <img 
                      src={item.thumbnail || `https://picsum.photos/seed/${item.id.slice(-5)}/800/400`} 
                      alt="Thumb" 
                      className="w-full h-32 object-cover rounded-md mb-3 opacity-90" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-xs font-bold text-gn-green mb-1">{item.tag}</span>
                    <h4 className="font-semibold text-foreground text-sm line-clamp-2 mb-2 flex-grow">
                      {item.curatedTitle || item.title}
                    </h4>
                    <div className="flex items-center text-gn-textMuted text-xs gap-1">
                      <Clock size={12} /> {formatTime(item.pubDate)}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* SECTION 2: DÒNG THỜI GIAN & ĐỐI THỦ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Cột trái: Dòng thời gian tin tức */}
              <div className="lg:col-span-2">
                <h2 className="text-lg font-bold text-foreground border-b border-gn-borderColor pb-2 mb-4">Dòng sự kiện mới nhất</h2>
                <div className="flex flex-col gap-4">
                  {filteredNews.slice(5).map((item) => (
                    <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="p-4 rounded-lg border border-gn-borderColor bg-gn-darkGray hover:bg-gn-borderColor/10 cursor-pointer transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-blue-400 uppercase">{item.source} • {item.tag}</span>
                        <span className="text-[10px] text-gn-textMuted">{formatTime(item.pubDate)}</span>
                      </div>
                      <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-gn-green transition-colors">
                        {item.curatedTitle || item.title}
                      </h3>
                      <p className="text-sm text-gn-textMuted line-clamp-2">
                        {item.curatedSummary || (item.content.split('.').slice(0, 2).join('.') + '.')}
                      </p>
                    </a>
                  ))}
                  {filteredNews.length === 0 && (
                    <div className="p-12 text-center border border-dashed border-gn-borderColor rounded-lg">
                      <p className="text-gn-textMuted">Không tìm thấy tin tức nào trong mục này trong 24h qua.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cột phải: Competitor Radar */}
              <div className="lg:col-span-1">
                <div className="p-5 rounded-lg border border-red-900/50 bg-red-950/20 relative overflow-hidden sticky top-24">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="text-red-500 animate-pulse" size={24} />
                    <h2 className="text-lg font-bold text-red-500 uppercase">Radar Đối Thủ</h2>
                  </div>
                  
                  <div className="flex flex-col gap-5">
                    {competitorRadar.length > 0 ? (
                      competitorRadar.map((comp) => (
                        <a 
                          key={comp.id} 
                          href={comp.link && comp.link !== "#" ? comp.link : "#"} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="border-b border-red-900/30 pb-3 last:border-0 last:pb-0 block group/comp cursor-pointer"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-foreground text-sm group-hover/comp:text-red-400 transition-colors">{comp.name}</span>
                            <span className="text-[10px] text-red-400/70 border border-red-900/50 px-2 py-0.5 rounded">{comp.time}</span>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-3 group-hover/comp:text-white transition-colors">{comp.action}</p>
                        </a>
                      ))
                    ) : (
                      <div className="text-center py-10 border border-dashed border-red-900/30 rounded-lg">
                        <p className="text-sm text-gray-500 italic">Không có biến động mới từ đối thủ trong 24h qua.</p>
                      </div>
                    )}
                  </div>
                  
                  <a 
                    href="#" onClick={(e) => e.preventDefault()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full mt-5 py-2 text-sm text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 rounded transition-colors flex justify-center items-center gap-1 cursor-pointer"
                  >
                    Xem báo cáo chi tiết <ChevronRight size={16} />
                  </a>
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}

