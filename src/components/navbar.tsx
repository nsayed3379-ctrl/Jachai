"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg text-ink-900">
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-700" fill="none">
        <path
          d="M12 2 L20 5 V11.5 C20 16.2 16.6 20.4 12 22 C7.4 20.4 4 16.2 4 11.5 V5 Z"
          fill="currentColor"
          opacity="0.15"
        />
        <path
          d="M12 2 L20 5 V11.5 C20 16.2 16.6 20.4 12 22 C7.4 20.4 4 16.2 4 11.5 V5 Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M8.3 11.7 L10.8 14.3 L15.7 8.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Jachai
    </Link>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-sand-50/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link href="/" className="px-3 py-2 rounded hover:bg-ink-100 text-ink-700">
            Explore
          </Link>
          {user?.role === "CONSUMER" && (
            <>
              <Link href="/me/reviews" className="px-3 py-2 rounded hover:bg-ink-100 text-ink-700">
                My reviews
              </Link>
              <Link href="/me/bookmarks" className="px-3 py-2 rounded hover:bg-ink-100 text-ink-700">
                Bookmarks
              </Link>
              <Link href="/me/messages" className="px-3 py-2 rounded hover:bg-ink-100 text-ink-700">
                Messages
              </Link>
            </>
          )}
          {user?.role === "BUSINESS_OWNER" && (
            <>
              <Link href="/owner" className="px-3 py-2 rounded hover:bg-ink-100 text-ink-700">
                My businesses
              </Link>
              <Link href="/owner/inbox" className="px-3 py-2 rounded hover:bg-ink-100 text-ink-700">
                Inbox
              </Link>
            </>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="px-3 py-2 rounded hover:bg-ink-100 text-ink-700">
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <button
              onClick={() => logout()}
              className="px-3 py-2 rounded text-sm text-ink-600 hover:bg-ink-100"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded bg-brand-700 text-white text-sm font-medium hover:bg-brand-800"
            >
              Log in
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded hover:bg-ink-100"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-ink-100 bg-sand-50 px-4 py-3 flex flex-col gap-1 text-sm">
          <Link href="/" className={cn("px-3 py-2 rounded hover:bg-ink-100")} onClick={() => setMenuOpen(false)}>
            Explore
          </Link>
          {user?.role === "CONSUMER" && (
            <>
              <Link href="/me/reviews" className="px-3 py-2 rounded hover:bg-ink-100" onClick={() => setMenuOpen(false)}>
                My reviews
              </Link>
              <Link href="/me/bookmarks" className="px-3 py-2 rounded hover:bg-ink-100" onClick={() => setMenuOpen(false)}>
                Bookmarks
              </Link>
              <Link href="/me/messages" className="px-3 py-2 rounded hover:bg-ink-100" onClick={() => setMenuOpen(false)}>
                Messages
              </Link>
            </>
          )}
          {user?.role === "BUSINESS_OWNER" && (
            <>
              <Link href="/owner" className="px-3 py-2 rounded hover:bg-ink-100" onClick={() => setMenuOpen(false)}>
                My businesses
              </Link>
              <Link href="/owner/inbox" className="px-3 py-2 rounded hover:bg-ink-100" onClick={() => setMenuOpen(false)}>
                Inbox
              </Link>
            </>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="px-3 py-2 rounded hover:bg-ink-100" onClick={() => setMenuOpen(false)}>
              Admin
            </Link>
          )}
          {user ? (
            <button onClick={() => logout()} className="text-left px-3 py-2 rounded hover:bg-ink-100 text-rose-600">
              Log out
            </button>
          ) : (
            <Link href="/login" className="px-3 py-2 rounded bg-brand-700 text-white text-center" onClick={() => setMenuOpen(false)}>
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
