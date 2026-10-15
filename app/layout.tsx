import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Meta 廣告 ROAS 儀表板",
  description: "監看 Meta 廣告成效，依規則給出把 ROAS 拉到目標的具體調整建議。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
        <footer className="text-xs text-muted text-center py-6">
          資料來源：Meta Marketing API。建議由規則引擎產生，僅供參考，實際調整請依帳戶狀況判斷。
        </footer>
      </body>
    </html>
  );
}
