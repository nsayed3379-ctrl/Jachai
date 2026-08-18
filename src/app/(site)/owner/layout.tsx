"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBusinessInboxUnreadCount } from "@/lib/use-business-inbox-unread";
import { cn } from "@/lib/utils";

/**
 * Persistent "My Businesses / Inbox" tabs for the owner section — mirrors
 * Yelp for Business's own top-level Inbox tab, rather than burying it as a
 * button on the businesses list. Only shown on the two section-root pages;
 * a specific business's dashboard/edit screens have their own context and
 * would just get visual clutter from a section-wide tab bar.
 */
function OwnerTabs() {
  const pathname = usePathname();
  const unreadCount = useBusinessInboxUnreadCount();

  const tabs = [
    { href: "/owner", label: "My Businesses", active: pathname === "/owner" },
    { href: "/owner/inbox", label: "Inbox", active: pathname.startsWith("/owner/inbox"), badge: unreadCount },
  ];

  return (
    <div className="mb-6 flex gap-1 border-b border-ink-100">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "relative -mb-px flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            tab.active
              ? "border-crimson-600 text-crimson-700"
              : "border-transparent text-ink-500 hover:text-ink-800"
          )}
        >
          {tab.label}
          {!!tab.badge && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-crimson-600 px-1 text-[10px] font-bold leading-none text-white">
              {tab.badge > 9 ? "9+" : tab.badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showTabs = pathname === "/owner" || pathname.startsWith("/owner/inbox");

  if (!showTabs) return <>{children}</>;

  return (
    <div>
      <OwnerTabs />
      {children}
    </div>
  );
}
