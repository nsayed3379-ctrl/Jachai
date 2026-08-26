import type { CategoryKind, CategoryModuleFlags } from "./types";

/**
 * Phase 2 — the single place that maps a category kind to its showcase modules
 * and the business-facing labels for them. The owner never sees the word
 * "kind": they see "Menu", "Doctors", "Membership plans", etc.
 *
 * `services` and `facilities` are both backed by the ServiceOffering table
 * (section OFFERING vs FACILITY); `team` by TeamMember; `menu` by MenuItem;
 * `products` by FeaturedProduct.
 */
export type ModuleKey = "services" | "facilities" | "team" | "menu" | "products";

export interface ModuleDef {
  key: ModuleKey;
  /** Tab label on the public business page. */
  publicLabel: string;
  /** Section heading in the owner form / dashboard. */
  ownerLabel: string;
  /** Primary "add" button label. */
  addLabel: string;
}

const SERVICES: ModuleDef = {
  key: "services",
  publicLabel: "Services",
  ownerLabel: "Services",
  addLabel: "Add service",
};

export const MODULES_BY_KIND: Record<CategoryKind, ModuleDef[]> = {
  RESTAURANT: [{ key: "menu", publicLabel: "Menu", ownerLabel: "Menu", addLabel: "Add menu item" }],
  CLINIC: [SERVICES, { key: "team", publicLabel: "Doctors", ownerLabel: "Doctors", addLabel: "Add doctor" }],
  SALON: [SERVICES, { key: "team", publicLabel: "Staff", ownerLabel: "Staff", addLabel: "Add staff member" }],
  RETAIL: [{ key: "products", publicLabel: "Products", ownerLabel: "Featured products", addLabel: "Add product" }],
  GYM: [
    { key: "services", publicLabel: "Membership", ownerLabel: "Membership plans", addLabel: "Add membership plan" },
    { key: "facilities", publicLabel: "Facilities", ownerLabel: "Facilities", addLabel: "Add facility" },
    { key: "team", publicLabel: "Trainers", ownerLabel: "Trainers", addLabel: "Add trainer" },
  ],
  GENERAL: [SERVICES],
};

export function modulesForKind(kind: CategoryKind | undefined | null): ModuleDef[] {
  return kind ? MODULES_BY_KIND[kind] ?? MODULES_BY_KIND.GENERAL : MODULES_BY_KIND.GENERAL;
}

/** Does this module have any data, per the flags on the business detail response? */
export function moduleHasData(key: ModuleKey, flags: CategoryModuleFlags | null): boolean {
  if (!flags) return false;
  switch (key) {
    case "services":
      return flags.hasOfferings;
    case "facilities":
      return flags.hasFacilities;
    case "team":
      return flags.hasTeam;
    case "menu":
      return flags.hasMenu;
    case "products":
      return flags.hasProducts;
    default:
      return false;
  }
}
