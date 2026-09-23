import { offerDiscountLabel } from "@/lib/offer-constants";
import { cn } from "@/lib/utils";
import type { OfferResponse } from "@/lib/types";

/** The prominent "20% OFF" / "Buy 1 Get 1" chip — shared by the offer card and detail page. */
export function OfferTypeBadge({
  offer,
  className,
}: {
  offer: Pick<OfferResponse, "offerType" | "discountValue">;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-gradient-to-r from-crimson-600 to-crimson-500 px-2.5 py-1 text-xs font-bold text-white shadow-md",
        className
      )}
    >
      {offerDiscountLabel(offer)}
    </span>
  );
}
