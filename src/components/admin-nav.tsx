"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/nid-queue", label: "NID queue" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/flagged-reviews", label: "Flagged reviews" },
  { href: "/admin/audit-log", label: "Audit log" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-ink-100 mb-6 overflow-x-auto">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "px-4 py-2 text-sm whitespace-nowrap border-b-2 -mb-px",
            pathname === l.href
              ? "border-crimson-600 text-crimson-700 font-medium"
              : "border-transparent text-ink-500 hover:text-ink-700"
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
