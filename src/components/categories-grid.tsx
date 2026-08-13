"use client";

import { useEffect, useState } from "react";
import { referenceApi } from "@/lib/api";
import type { Category } from "@/lib/types";
import { Card } from "./ui/misc";

// Best-effort visual icon per category name — purely presentational, the
// category list itself always comes from GET /api/v1/categories.
const CATEGORY_ICONS: [RegExp, string][] = [
  [/restaurant|food|dining|cafe|coffee|bakery/i, "🍽️"],
  [/shop|store|retail|fashion|cloth|boutique/i, "🛍️"],
  [/night|club|bar|lounge/i, "🌃"],
  [/health|clinic|hospital|doctor|medical|pharma/i, "🏥"],
  [/beauty|spa|salon|parlor|parlour/i, "💆"],
  [/auto|car|garage|mechanic|repair/i, "🚗"],
  [/home|electric|plumb|clean|repair service/i, "🧰"],
  [/education|school|tuition|coaching|training/i, "🎓"],
  [/grocery|market|super/i, "🛒"],
  [/electronics|mobile|computer|gadget/i, "💻"],
  [/hotel|travel|tour/i, "🏨"],
  [/gym|fitness|sport/i, "🏋️"],
];

function iconFor(name: string): string {
  return CATEGORY_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? "📦";
}

/** Home page category tiles — dynamic list, clicking filters the search results below. */
export function CategoriesGrid({ onSelect }: { onSelect: (category: Category) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    referenceApi
      .categories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-ink-900 text-center mb-8">
        Categories
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {categories.slice(0, 8).map((cat) => (
          <button key={cat.id} type="button" onClick={() => onSelect(cat)} className="group text-left">
            <Card className="flex flex-col items-center justify-center gap-2.5 py-8 transition-all duration-200 group-hover:shadow-lift group-hover:-translate-y-0.5 group-hover:border-crimson-200">
              <span className="text-3xl">{iconFor(cat.name)}</span>
              <span className="text-sm font-semibold text-ink-800">{cat.name}</span>
            </Card>
          </button>
        ))}
      </div>
    </section>
  );
}
