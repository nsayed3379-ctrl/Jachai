"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Curated Yelp-style taxonomy (design ref: earlier hero mockup) — deliberately
 * a fixed frontend list, not the backend `Category` table, so every entry can
 * carry a hand-picked subcategory set for the hover mega-menu. Selecting
 * either a top-level tab or a subcategory just becomes a free-text search
 * query (`q`) rather than a strict category filter, so it always returns
 * something reasonable via the existing fuzzy name search regardless of how
 * admin-seeded category names happen to be spelled.
 */
const CATEGORY_NAV: { label: string; subcategories: string[] }[] = [
  {
    label: "Restaurants",
    subcategories: [
      "Takeout",
      "Delivery",
      "Hot & Trendy",
      "New Restaurants",
      "Breakfast & Brunch",
      "Lunch",
      "Dinner",
      "Coffee & Cafes",
      "Pizza",
      "Bakeries",
      "Food Trucks",
      "Sports Bars & Pubs",
    ],
  },
  {
    label: "Cafés",
    subcategories: ["Coffee & Tea", "Breakfast & Brunch", "Desserts", "Bakeries", "Tea Houses", "Juice Bars"],
  },
  {
    label: "Shopping",
    subcategories: ["Shopping Centers", "Clothing", "Grocery", "Electronics", "Home & Garden", "Markets"],
  },
  {
    label: "Hotels",
    subcategories: ["Hotels", "Resorts", "Guest Houses", "Boutique Hotels", "Budget Stays"],
  },
  {
    label: "Beauty & Salon",
    subcategories: ["Hair Salons", "Spas", "Barbers", "Nail Salons", "Skin Care", "Makeup Artists"],
  },
  {
    label: "Fitness",
    subcategories: ["Gyms", "Yoga", "Personal Trainers", "Dance Studios", "Martial Arts"],
  },
  {
    label: "More",
    subcategories: ["Automotive", "Home Services", "Professional Services", "Nightlife", "Things to Do"],
  },
];

export function CategoryQuickNav({ onSelect }: { onSelect: (query: string) => void }) {
  const [active, setActive] = useState(CATEGORY_NAV[0].label);

  return (
    <div className="hidden lg:block backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-8 overflow-visible">
        {CATEGORY_NAV.map((cat) => (
          <div key={cat.label} className="group relative">
            <button
              type="button"
              onClick={() => {
                setActive(cat.label);
                onSelect(cat.label);
              }}
              className={cn(
                "shrink-0 whitespace-nowrap border-b-[3px] px-1 py-3 text-base font-semibold text-white transition-colors",
                active === cat.label ? "border-white" : "border-transparent hover:border-white/70"
              )}
            >
              {cat.label}
            </button>

            {/* Hover mega-menu — invisible/opacity-0/scaled-down by default,
                eased in via the parent .group's hover/focus-within so it
                works with mouse and keyboard alike. shadow-lift + a hairline
                ring give it a crisp, "floating" premium edge against any
                background (hero photo or a solid page). */}
            <div
              className={cn(
                "invisible absolute left-0 top-full z-40 w-[min(680px,calc(100vw-2rem))] origin-top",
                "-translate-y-1 scale-[0.98] opacity-0",
                "rounded-b-xl border-t-[3px] border-crimson-500 bg-surface p-6 shadow-lift ring-1 ring-black/5",
                "transition-[opacity,transform,visibility] duration-200 ease-out",
                "group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100",
                "group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100"
              )}
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
                {cat.subcategories.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setActive(cat.label);
                      onSelect(sub);
                    }}
                    className="flex min-h-[40px] items-center rounded-lg px-2.5 py-2 text-left text-sm font-medium text-ink-800 transition-colors hover:bg-crimson-50 hover:text-crimson-700"
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
