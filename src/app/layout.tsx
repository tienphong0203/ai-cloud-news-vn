import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VN Tech Pulse — Tin AI & Cloud Việt Nam',
  description: 'Tổng hợp tin tức AI, Cloud và Startup công nghệ tại Việt Nam trong 24 giờ qua.',
  openGraph: {
    title: 'VN Tech Pulse',
    description: 'Tin tức AI & Cloud Việt Nam trong 24h',
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
