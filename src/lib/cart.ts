import type { Cart, CartLine } from "./types";

/**
 * Client-side cart — one business at a time, held in localStorage. The backend
 * re-validates every price, fee and total and snapshots them at order
 * placement; this is purely for the pre-checkout UX. Guest carts are out of
 * scope for Phase A (checkout requires a logged-in consumer).
 */

const KEY = "rp:cart";
const CHANGED_EVENT = "rp:cart-changed";
const MAX_QTY = 50;

export class CartConflictError extends Error {
  existingBusinessName: string;
  constructor(existingBusinessName: string) {
    super("Cart contains items from another business");
    this.name = "CartConflictError";
    this.existingBusinessName = existingBusinessName;
  }
}

export interface CartBusinessRef {
  id: string;
  name: string;
  slug: string;
}

export interface CartItemRef {
  id: string;
  name: string;
  price: number;
}

export function readCart(): Cart | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cart;
    if (!parsed || !parsed.businessId || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCart(cart: Cart | null) {
  if (typeof window === "undefined") return;
  try {
    if (!cart || cart.lines.length === 0) {
      window.localStorage.removeItem(KEY);
    } else {
      window.localStorage.setItem(KEY, JSON.stringify(cart));
    }
  } catch {
    /* private mode / quota — the cart just won't persist */
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function clearCart() {
  writeCart(null);
}

/** Add (or bump) a line. Throws {@link CartConflictError} if the cart belongs to another business. */
export function addToCart(business: CartBusinessRef, item: CartItemRef, qty: number): Cart {
  const current = readCart();
  if (current && current.businessId !== business.id) {
    throw new CartConflictError(current.businessName);
  }
  const base: Cart =
    current ?? { businessId: business.id, businessName: business.name, businessSlug: business.slug, lines: [] };
  const next = mutateLine(base, item, qty);
  writeCart(next);
  return next;
}

/** Discard whatever is in the cart and start fresh with this item. */
export function startNewCart(business: CartBusinessRef, item: CartItemRef, qty: number): Cart {
  const fresh: Cart = {
    businessId: business.id,
    businessName: business.name,
    businessSlug: business.slug,
    lines: [],
  };
  const next = mutateLine(fresh, item, qty);
  writeCart(next);
  return next;
}

export function setQuantity(menuItemId: string, qty: number): Cart | null {
  const current = readCart();
  if (!current) return null;
  const lines = current.lines
    .map((l) => (l.menuItemId === menuItemId ? { ...l, quantity: clampQty(qty) } : l))
    .filter((l) => l.quantity > 0);
  const next = lines.length ? { ...current, lines } : null;
  writeCart(next);
  return next;
}

export function removeLine(menuItemId: string): Cart | null {
  return setQuantity(menuItemId, 0);
}

export function cartCount(cart: Cart | null): number {
  return cart ? cart.lines.reduce((n, l) => n + l.quantity, 0) : 0;
}

export function cartSubtotal(cart: Cart | null): number {
  return cart ? cart.lines.reduce((sum, l) => sum + l.price * l.quantity, 0) : 0;
}

// ---- useSyncExternalStore plumbing -------------------------------------------

export function subscribeToCart(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) cb();
  };
  window.addEventListener(CHANGED_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGED_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

let cachedRaw: string | null = null;
let cachedCart: Cart | null = null;

/** Stable snapshot for useSyncExternalStore — same object identity until the stored JSON changes. */
export function getCartSnapshot(): Cart | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedCart = readCart();
  }
  return cachedCart;
}

export function getCartServerSnapshot(): Cart | null {
  return null;
}

// ---- internals ------------------------------------------------------------

function mutateLine(cart: Cart, item: CartItemRef, qty: number): Cart {
  const existing = cart.lines.find((l) => l.menuItemId === item.id);
  let lines: CartLine[];
  if (existing) {
    lines = cart.lines.map((l) =>
      l.menuItemId === item.id ? { ...l, quantity: clampQty(l.quantity + qty), price: item.price, name: item.name } : l
    );
  } else {
    lines = [...cart.lines, { menuItemId: item.id, name: item.name, price: item.price, quantity: clampQty(qty) }];
  }
  return { ...cart, lines: lines.filter((l) => l.quantity > 0) };
}

function clampQty(q: number): number {
  return Math.max(0, Math.min(MAX_QTY, Math.round(q)));
}
