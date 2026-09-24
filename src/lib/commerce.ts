import type {
  Booking,
  BookingStatus,
  CategoryKind,
  FulfillmentType,
  Order,
  OrderStatus,
  PaymentMethod,
} from "./types";

/** Phase A: only restaurants can take direct orders. Phase B adds RETAIL. */
export function canSellDirect(kind: CategoryKind): boolean {
  return kind === "RESTAURANT";
}

/** Phase C: only salons take appointment bookings today. */
export function canBook(kind: CategoryKind): boolean {
  return kind === "SALON";
}

export function formatTk(amount: number): string {
  const n = Math.round(amount * 100) / 100;
  return "৳" + (Number.isInteger(n) ? n.toString() : n.toFixed(2));
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "New",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  PICKED_UP: "Picked up",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

/** Tailwind bg/text pair for a status pill. */
export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-sky-100 text-sky-800",
  PREPARING: "bg-sky-100 text-sky-800",
  READY_FOR_PICKUP: "bg-violet-100 text-violet-800",
  OUT_FOR_DELIVERY: "bg-violet-100 text-violet-800",
  PICKED_UP: "bg-emerald-100 text-emerald-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-ink-100 text-ink-500",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: "Cash on delivery",
  PAY_AT_BUSINESS: "Pay at the business",
};

/**
 * Same payment methods read differently depending on how the order is being
 * fulfilled — "Cash on delivery" implies a courier, which is misleading on a
 * Pickup order (there's no one delivering it). The underlying PaymentMethod
 * value is unchanged; only the label shown to the customer/owner adapts.
 */
export function paymentMethodLabel(method: PaymentMethod, fulfillmentType: FulfillmentType): string {
  if (fulfillmentType === "PICKUP" && method === "CASH_ON_DELIVERY") return "Pay at pickup";
  return PAYMENT_METHOD_LABELS[method];
}

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  PICKUP: "Pickup",
  OWN_DELIVERY: "Own delivery",
};

export interface OwnerOrderAction {
  label: string;
  status: OrderStatus;
  destructive?: boolean;
}

/** The buttons an owner sees for an order in its current status. */
export function nextOwnerActions(order: Order): OwnerOrderAction[] {
  const delivery = order.fulfillmentType === "OWN_DELIVERY";
  switch (order.status) {
    case "PENDING":
      return [
        { label: "Accept", status: "ACCEPTED" },
        { label: "Reject", status: "REJECTED", destructive: true },
      ];
    case "ACCEPTED":
      return [
        { label: "Start preparing", status: "PREPARING" },
        { label: "Cancel", status: "CANCELLED", destructive: true },
      ];
    case "PREPARING":
      return [
        delivery
          ? { label: "Mark out for delivery", status: "OUT_FOR_DELIVERY" }
          : { label: "Mark ready", status: "READY_FOR_PICKUP" },
        { label: "Cancel", status: "CANCELLED", destructive: true },
      ];
    case "READY_FOR_PICKUP":
      return [{ label: "Mark picked up", status: "PICKED_UP" }];
    case "OUT_FOR_DELIVERY":
      return [{ label: "Mark delivered", status: "DELIVERED" }];
    case "PICKED_UP":
    case "DELIVERED":
      return [{ label: "Mark completed", status: "COMPLETED" }];
    default:
      return [];
  }
}

/** Status chips for the owner Orders page (in workflow order). */
export const OWNER_ORDER_FILTERS: { label: string; status: OrderStatus | null }[] = [
  { label: "All", status: null },
  { label: "New", status: "PENDING" },
  { label: "Accepted", status: "ACCEPTED" },
  { label: "Preparing", status: "PREPARING" },
  { label: "Ready", status: "READY_FOR_PICKUP" },
  { label: "Out for delivery", status: "OUT_FOR_DELIVERY" },
  { label: "Completed", status: "COMPLETED" },
  { label: "Cancelled", status: "CANCELLED" },
];

// ---------------------------------------------------------------------------
// Booking (Phase C)
// ---------------------------------------------------------------------------
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  NO_SHOW: "No-show",
};

export const BOOKING_STATUS_TONE: Record<BookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-ink-100 text-ink-500",
  REJECTED: "bg-rose-100 text-rose-700",
  NO_SHOW: "bg-rose-100 text-rose-700",
};

export interface OwnerBookingAction {
  label: string;
  status: BookingStatus;
  destructive?: boolean;
}

/** The buttons an owner sees for a booking in its current status. */
export function nextOwnerBookingActions(booking: Booking): OwnerBookingAction[] {
  switch (booking.status) {
    case "PENDING":
      return [
        { label: "Confirm", status: "CONFIRMED" },
        { label: "Reject", status: "REJECTED", destructive: true },
      ];
    case "CONFIRMED":
      return [
        { label: "Mark completed", status: "COMPLETED" },
        { label: "No-show", status: "NO_SHOW", destructive: true },
        { label: "Cancel", status: "CANCELLED", destructive: true },
      ];
    default:
      return [];
  }
}

/** Formats a bare "YYYY-MM-DD" (LocalDate) safely — no UTC-parse day-shift like `new Date(iso)` risks. */
export function formatBookingDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** "14:30:00" or "14:30" (LocalTime) -> "2:30 PM". */
export function formatBookingTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Status chips for the owner Bookings page. */
export const OWNER_BOOKING_FILTERS: { label: string; status: BookingStatus | null }[] = [
  { label: "All", status: null },
  { label: "Pending", status: "PENDING" },
  { label: "Confirmed", status: "CONFIRMED" },
  { label: "Completed", status: "COMPLETED" },
  { label: "Cancelled", status: "CANCELLED" },
  { label: "Rejected", status: "REJECTED" },
  { label: "No-show", status: "NO_SHOW" },
];
