import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VN AI & Cloud Today",
  description: "Tin tức AI & Cloud tại Việt Nam trong 24 giờ qua",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
