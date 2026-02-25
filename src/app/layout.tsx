import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "HN Bot Detector",
  description: "Detect LLM-generated and bot comments on Hacker News",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <nav className="border-b border-[#262626] px-6 py-4">
          <div className="mx-auto max-w-5xl flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-orange-500">
              HN Bot Detector
            </Link>
            <Link
              href="/"
              className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              User Analyzer
            </Link>
            <Link
              href="/post/scan"
              className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Post Scanner
            </Link>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
