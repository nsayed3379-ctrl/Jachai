import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AuthModalProvider } from "@/lib/auth-modal-context";
<<<<<<< HEAD
import { ToastProvider } from "@/lib/toast-context";
import { Navbar } from "@/components/navbar";
import { AuthModal } from "@/components/auth/auth-modal";
=======
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/lib/toast-context";
import { Navbar } from "@/components/navbar";
import { AuthModal } from "@/components/auth/auth-modal";

// Runs before hydration so the correct theme class is on <html> for the
// very first paint — without this the page flashes light before JS applies
// the user's saved/system preference.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;
>>>>>>> 1a6eb2632f4f603f8b31a258495a8f896d8f0a16

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
    <html lang="en" className={`${sora.variable} ${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
<<<<<<< HEAD
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
=======
        <ThemeProvider>
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
        </ThemeProvider>
>>>>>>> 1a6eb2632f4f603f8b31a258495a8f896d8f0a16
      </body>
    </html>
  );
}
