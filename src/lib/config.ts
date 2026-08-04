export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8085";

export const PAGE_SIZE = 20;

export const PRICE_TIER_LABELS: Record<string, string> = {
  BUDGET: "৳ Budget",
  MODERATE: "৳৳ Moderate",
  EXPENSIVE: "৳৳৳ Expensive",
  VERY_EXPENSIVE: "৳৳৳৳ Very expensive",
};

export const SORT_LABELS: Record<string, string> = {
  newest: "Newest",
  rating: "Highest rated",
  distance: "Nearest",
  most_reviewed: "Most reviewed",
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  FAKE: "Fake",
  OFFENSIVE: "Offensive",
  OTHER: "Other",
};

export const VOTE_TYPE_LABELS: Record<string, string> = {
  USEFUL: "Useful",
  FUNNY: "Funny",
  COOL: "Cool",
};
