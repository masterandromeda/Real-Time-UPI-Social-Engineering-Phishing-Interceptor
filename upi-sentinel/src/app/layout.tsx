import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UPI Sentinel — Predictive Scam Interceptor",
  description:
    "An AI-powered security intelligence platform that identifies social-engineering signals, analyzes suspicious links, correlates device-risk indicators, and helps prevent UPI scams before payment authorization.",
  keywords: ["UPI fraud", "scam detection", "cybersecurity", "social engineering", "phishing interceptor"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#030712] text-[#F8FAFC]">{children}</body>
    </html>
  );
}
