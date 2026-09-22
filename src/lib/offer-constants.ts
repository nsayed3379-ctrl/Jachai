import type { OfferAvailability, OfferClaimStatus, OfferResponse, OfferStatus, OfferType } from "./types";

export const OFFER_TYPES: { value: OfferType; label: string }[] = [
  { value: "PERCENTAGE_DISCOUNT", label: "Percentage discount" },
  { value: "FIXED_AMOUNT_DISCOUNT", label: "Fixed amount discount" },
  { value: "BUY_ONE_GET_ONE", label: "Buy 1 Get 1" },
  { value: "COMBO_DEAL", label: "Combo deal" },
  { value: "FREE_ITEM", label: "Free item" },
  { value: "OTHER", label: "Other" },
];

export const OFFER_TYPE_LABELS: Record<OfferType, string> = Object.fromEntries(
  OFFER_TYPES.map((t) => [t.value, t.label])
) as Record<OfferType, string>;

/** discountValue is only meaningful for the two numeric types — everything else carries its meaning in the title/badge text alone. */
export const OFFER_TYPE_HAS_NUMERIC_VALUE: Record<OfferType, boolean> = {
  PERCENTAGE_DISCOUNT: true,
  FIXED_AMOUNT_DISCOUNT: true,
  BUY_ONE_GET_ONE: false,
  COMBO_DEAL: false,
  FREE_ITEM: false,
  OTHER: false,
};

export const OFFER_AVAILABILITY_LABELS: Record<OfferAvailability, string> = {
  ONLINE: "Online",
  IN_STORE: "In-store",
  BOTH: "Online & in-store",
};

export const OFFER_STATUS_META: Record<OfferStatus, { label: string; tone: "brand" | "gold" | "rose" | "neutral" | "crimson" }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PENDING_APPROVAL: { label: "Pending approval", tone: "gold" },
  ACTIVE: { label: "Active", tone: "brand" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  REJECTED: { label: "Rejected", tone: "rose" },
};

export const OFFER_CLAIM_STATUS_META: Record<OfferClaimStatus, { label: string; tone: "brand" | "gold" | "rose" | "neutral" | "crimson" }> = {
  CLAIMED: { label: "Claimed", tone: "gold" },
  REDEEMED: { label: "Redeemed", tone: "brand" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

/**
 * The short badge text a card/detail page leads with — "20% OFF", "৳200 OFF",
 * "Buy 1 Get 1", etc. Never assumes discountValue is set (see
 * OFFER_TYPE_HAS_NUMERIC_VALUE) — the non-numeric types carry their meaning
 * in this label alone, not a computed number.
 */
export function offerDiscountLabel(offer: Pick<OfferResponse, "offerType" | "discountValue">): string {
  switch (offer.offerType) {
    case "PERCENTAGE_DISCOUNT":
      return offer.discountValue != null ? `${offer.discountValue}% OFF` : "Discount";
    case "FIXED_AMOUNT_DISCOUNT":
      return offer.discountValue != null ? `৳${offer.discountValue} OFF` : "Discount";
    case "BUY_ONE_GET_ONE":
      return "Buy 1 Get 1";
    case "COMBO_DEAL":
      return "Combo deal";
    case "FREE_ITEM":
      return "Free item";
    default:
      return "Special offer";
  }
}

/** Filters shown as a single-select pill row on the Offers list — "keep the interface simple". */
export type OfferFeedFilter = "ALL" | "NEARBY" | "ENDING_SOON" | "ONLINE" | "IN_STORE";

export const OFFER_FEED_FILTERS: { value: OfferFeedFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "NEARBY", label: "Nearby" },
  { value: "ENDING_SOON", label: "Ending Soon" },
  { value: "ONLINE", label: "Online" },
  { value: "IN_STORE", label: "In-store" },
];
