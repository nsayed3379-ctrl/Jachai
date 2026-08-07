import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AuthModalProvider } from "@/lib/auth-modal-context";
import { ToastProvider } from "@/lib/toast-context";
import { Navbar } from "@/components/navbar";
import { AuthModal } from "@/components/auth/auth-modal";

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
            <AuthModalProvider>
              <Navbar />
              {children}
              <footer className="border-t border-ink-100 py-8 mt-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-xs text-ink-400 flex flex-wrap justify-between gap-2">
                  <span>© {new Date().getFullYear()} Jachai. Dhaka-first, verification-centric.</span>
                  <span>Built for Bangladesh's local businesses.</span>
                </div>
              </footer>
              <AuthModal />
            </AuthModalProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
