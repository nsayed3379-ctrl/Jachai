"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { useCommunityUsernameModal } from "@/lib/community-username-modal-context";
import { cn } from "@/lib/utils";
import { COMMUNITY_ITEMS, SOCIAL_ITEMS, type NavItem } from "./community-sidebar";

/** The 3 most-reached-for destinations, kept as always-visible icon buttons — everything
 *  else (Questions, Reviews, Discussions, Offers, Following, Followers, Nearby, Settings)
 *  lives behind the menu button instead of a long horizontally-scrolling tab strip. */
const QUICK_ITEMS = COMMUNITY_ITEMS.filter((i) => i.label === "Home" || i.label === "Explore" || i.label === "Saved");

/**
 * Icon-first mobile equivalent of CommunitySidebar — a menu button (opens a
 * dropdown with the full Community/Social nav, same groups/order as the
 * desktop sidebar) plus a couple of quick icon shortcuts, instead of the
 * old horizontally-scrolling row of ~10 text pills.
 */
export function CommunityMobileNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const { openLogin } = useAuthModal();
  const { openModal: openUsernameModal } = useCommunityUsernameModal();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function isActive(item: NavItem) {
    if (item.isActive) return item.isActive(pathname, searchParams);
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function resolvedHref(item: NavItem) {
    if (!item.requiresCommunityProfile) return item.href;
    return profile?.communityUsername ? `/community/u/${profile.communityUsername}${item.href.replace("/community", "")}` : item.href;
  }

  function handleDrawerItemClick(e: React.MouseEvent, item: NavItem) {
    setOpen(false);
    if (!item.requiresCommunityProfile) return;
    if (!user) {
      e.preventDefault();
      openLogin();
      return;
    }
    if (!profile?.communityUsername) {
      e.preventDefault();
      openUsernameModal();
    }
  }

  function renderDrawerRow(item: NavItem) {
    const active = isActive(item);
    return (
      <Link
        key={item.label}
        href={resolvedHref(item)}
        onClick={(e) => handleDrawerItemClick(e, item)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
          active ? "bg-crimson-50 text-crimson-700" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
        )}
      >
        <item.icon size={17} className="shrink-0" strokeWidth={1.75} />
        {item.label}
      </Link>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Community menu"
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
            open ? "border-ink-300 bg-ink-100 text-ink-900" : "border-ink-200 text-ink-600 hover:bg-ink-50"
          )}
        >
          {open ? <X size={18} /> : <MoreHorizontal size={18} />}
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          {QUICK_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={resolvedHref(item)}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150",
                  active ? "border-crimson-200 bg-crimson-50 text-crimson-700" : "border-ink-200 text-ink-600 hover:bg-ink-50"
                )}
              >
                <item.icon size={17} strokeWidth={1.75} />
              </Link>
            );
          })}
        </div>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-2 w-64 animate-scale-in rounded-xl border border-ink-100 bg-surface p-2 shadow-pop"
        >
          <p className="px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Community</p>
          <div className="space-y-0.5">{COMMUNITY_ITEMS.map(renderDrawerRow)}</div>
          <div className="mt-2 border-t border-ink-100 pt-2">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Social</p>
            <div className="space-y-0.5">{SOCIAL_ITEMS.map(renderDrawerRow)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
