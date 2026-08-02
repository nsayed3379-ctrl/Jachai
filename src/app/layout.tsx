import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import { Navbar } from "@/components/navbar";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Jachai — Verified local businesses",
  description:
    "Find and review verified local businesses in Bangladesh — search by category, area, and rating, with NID-verified trust badges.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} ${mono.variable}`}>
      <body>
        <ToastProvider>
          <AuthProvider>
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-8 min-h-[calc(100vh-4rem)]">{children}</main>
            <footer className="border-t border-ink-100 py-8 mt-12">
              <div className="mx-auto max-w-6xl px-4 text-xs text-ink-400 flex flex-wrap justify-between gap-2">
                <span>© {new Date().getFullYear()} Jachai. Dhaka-first, verification-centric.</span>
                <span>Built for Bangladesh's local businesses.</span>
              </div>
            </footer>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
