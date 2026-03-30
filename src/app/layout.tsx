import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GreenNode Radar — AI & Cloud News Vietnam',
  description: 'Tổng hợp tin tức AI, Cloud, Bán dẫn và Chuyển đổi số tại Việt Nam & quốc tế.',
  openGraph: {
    title: 'GreenNode Radar',
    description: 'AI & Cloud News — Việt Nam, China, USA, Europe',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen relative z-10">{children}</body>
    </html>
  );
}
