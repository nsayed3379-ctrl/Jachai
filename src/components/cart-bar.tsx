"use client";

import Link from "next/link";
import { useCart } from "@/lib/use-cart";
import { formatTk } from "@/lib/commerce";

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Sticky bottom cart bar on a business page — appears only when the client
 * cart holds items for *this* business. Tapping it goes to checkout. Purely
 * presentational; the cart it reads (`useCart`) and the checkout it links to
 * are unchanged.
 */
export function CartBar({ businessId, businessSlug }: { businessId: string; businessSlug: string }) {
  const { cart, count, subtotal } = useCart();

  if (!cart || cart.businessId !== businessId || count === 0) return null;

  return (
    <>
      {/* Spacer so the fixed bar never covers the last bit of the page. */}
      <div aria-hidden className="h-20" />
      <div className="fixed inset-x-0 bottom-0 z-40 animate-scale-in border-t border-ink-100 bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-crimson-600 text-white">
              <BagIcon />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-ink-900">
                {count} {count === 1 ? "item" : "items"}
              </span>
              <span className="block text-xs text-ink-500">{formatTk(subtotal)}</span>
            </span>
          </div>
          <Link
            href={`/business/${businessSlug}/checkout`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-crimson-600 px-4 sm:px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-crimson-500 active:scale-95"
          >
            View cart
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
}