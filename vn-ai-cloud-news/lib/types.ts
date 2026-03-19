export type Category = "all" | "ai" | "cloud" | "startup";

export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  summary: string;
  publishedAt: string; // ISO string
  category: Exclude<Category, "all">;
  imageUrl?: string;
}

export interface NewsCache {
  articles: Article[];
  lastUpdated: string; // ISO string
}
