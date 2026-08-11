"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";

function Logo({ light }: { light: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-display font-extrabold text-xl transition-colors",
        light ? "text-white" : "text-ink-900"
      )}
    >
      <svg viewBox="0 0 24 24" className={cn("h-7 w-7 transition-colors", light ? "text-white" : "text-crimson-600")} fill="none">
        <path
          d="M12 2 L20 5 V11.5 C20 16.2 16.6 20.4 12 22 C7.4 20.4 4 16.2 4 11.5 V5 Z"
          fill="currentColor"
          opacity="0.15"
        />
        <path
          d="M12 2 L20 5 V11.5 C20 16.2 16.6 20.4 12 22 C7.4 20.4 4 16.2 4 11.5 V5 Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M8.3 11.7 L10.8 14.3 L15.7 8.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Jachai
    </Link>
  );
}

function AccountMenuLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "block rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
        active ? "bg-crimson-50 text-crimson-700 font-medium" : "text-ink-700 hover:bg-ink-50 hover:text-crimson-700"
      )}
    >
      {children}
    </Link>
  );
}

function Avatar({ photoUrl, size = 28 }: { photoUrl: string | null | undefined; size?: number }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover border border-black/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="rounded-full bg-ink-200 text-ink-500 p-1" fill="currentColor">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.14 0-7.5 2.46-7.5 5.5v.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-.5c0-3.04-3.36-5.5-7.5-5.5Z" />
    </svg>
  );
}

export function Navbar() {
  const { user, profile, logout } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHero = pathname === "/";
  const [scrolled, setScrolled] = useState(!isHero);

  // On the home page the navbar starts transparent, floating over the hero
  // photo; everywhere else (no hero behind it) it's solid from the first paint.
  useEffect(() => {
    if (!isHero) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHero]);

  const transparent = isHero && !scrolled;
  const linkClass = transparent
    ? "px-3 py-2 rounded-full hover:bg-white/15 text-white"
    : "px-3 py-2 rounded-full hover:bg-crimson-50 hover:text-crimson-700 text-ink-700";
  const accountLinkClass = transparent
    ? "px-3 py-2 rounded-full text-sm font-medium text-white hover:bg-white/15"
    : "px-3 py-2 rounded-full text-sm font-medium text-ink-600 hover:bg-ink-100";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-colors duration-300",
        transparent ? "bg-transparent border-b border-transparent" : "border-b border-ink-100 bg-surface/90 backdrop-blur shadow-sm"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo light={transparent} />

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {user?.role === "BUSINESS_OWNER" && (
            <>
              <Link href="/owner" className={linkClass}>
                {t("nav.my_businesses")}
              </Link>
              <Link href="/owner/inbox" className={linkClass}>
                {t("nav.inbox")}
              </Link>
            </>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className={linkClass}>
              {t("nav.admin")}
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user && (
            <NotificationBell
              className={transparent ? "text-white hover:bg-white/15" : "text-ink-600 hover:bg-ink-100"}
            />
          )}
          <ThemeToggle
            className={
              transparent ? "text-white hover:bg-white/15" : "text-ink-600 hover:bg-ink-100"
            }
          />
          {user ? (
            <>
              <div
                className="relative"
                onMouseEnter={() => setAccountMenuOpen(true)}
                onMouseLeave={() => setAccountMenuOpen(false)}
              >
                <Link href="/account" className={cn(accountLinkClass, "flex items-center gap-2")}>
                  <Avatar photoUrl={profile?.profilePhotoUrl} />
                  {profile?.name || t("nav.account")}
                  <svg
                    viewBox="0 0 20 20"
                    className={cn("h-3.5 w-3.5 transition-transform duration-150", accountMenuOpen && "rotate-180")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>

                {/* pt-2 keeps this touching the trigger above (no dead zone) while still
                    giving the visible panel some breathing room below it. */}
                {accountMenuOpen && (
                  <div className="absolute right-0 top-full w-56 pt-2 z-50">
                    <div className="rounded-xl border border-ink-100 bg-surface shadow-pop p-1.5">
                      {user.role === "CONSUMER" && (
                        <>
                          <AccountMenuLink
                            href="/me/reviews"
                            active={pathname === "/me/reviews"}
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            {t("nav.my_reviews")}
                          </AccountMenuLink>
                          <AccountMenuLink
                            href="/me/bookmarks"
                            active={pathname === "/me/bookmarks"}
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            {t("nav.bookmarks")}
                          </AccountMenuLink>
                          <AccountMenuLink
                            href="/me/messages"
                            active={pathname.startsWith("/me/messages")}
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            {t("nav.messages")}
                          </AccountMenuLink>
                          <div className="my-1 h-px bg-ink-100" />
                        </>
                      )}
                      <AccountMenuLink
                        href="/account"
                        active={pathname === "/account"}
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        {t("nav.account_settings")}
                      </AccountMenuLink>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => logout()} className={accountLinkClass}>
                {t("nav.log_out")}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={openLogin} className={accountLinkClass}>
                {t("nav.log_in")}
              </button>
              <button
                type="button"
                onClick={openSignup}
                className="px-5 py-2 rounded-full bg-crimson-600 text-white text-sm font-semibold shadow-sm hover:bg-crimson-700"
              >
                {t("nav.sign_up")}
              </button>
            </>
          )}
        </div>

        <button
          className={cn("md:hidden p-2 rounded-full", transparent ? "text-white hover:bg-white/15" : "hover:bg-ink-100")}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-ink-100 bg-surface px-4 py-3 flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-ink-500">{t("nav.theme")}</span>
            <ThemeToggle className="text-ink-600 hover:bg-ink-100" />
          </div>
          {user && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-ink-500">Notifications</span>
              <NotificationBell className="text-ink-600 hover:bg-ink-100" />
            </div>
          )}
          {user?.role === "CONSUMER" && (
            <>
              <Link href="/me/reviews" className="px-3 py-2 rounded hover:bg-ink-100" onClick={() => setMenuOpen(false)}>
                {t("nav.my_reviews")}
              </Link>
              <Link href="/me/bookmarks" className="px-3 py-2 rounded hover:bg-ink-100" onClick={() => setMenuOpen(false)}>
                {t("nav.bookmarks")}
              </Link>
              <Link href="/me/messages" className="px-3 py-2 rounded hover:bg-ink-100" onClick={() => setMenuOpen(false)}>
                {t("nav.messages")}
              </Link>
            </>
          )}
          {user?.role === "BUSINESS_OWNER" && (
            <>
              <Link href="/owner" className="px-3 py-2 rounded hover:bg-ink-100" onClick={() => setMenuOpen(false)}>
                {t("nav.my_businesses")}
              </Link>
              <Link href="/owner/inbox" className="px-3 py-2 rounded hover:bg-ink-100" onClick={() => setMenuOpen(false)}>
                {t("nav.inbox")}
              </Link>
            </>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="px-3 py-2 rounded hover:bg-ink-100" onClick={() => setMenuOpen(false)}>
              {t("nav.admin")}
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/account"
                className="px-3 py-2 rounded hover:bg-ink-100 flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                <Avatar photoUrl={profile?.profilePhotoUrl} size={24} />
                {profile?.name || t("nav.account")}
              </Link>
              <button onClick={() => logout()} className="text-left px-3 py-2 rounded hover:bg-ink-100 text-rose-600">
                {t("nav.log_out")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="px-3 py-2 rounded hover:bg-ink-100 text-center"
                onClick={() => {
                  setMenuOpen(false);
                  openLogin();
                }}
              >
                {t("nav.log_in")}
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-full bg-crimson-600 text-white font-semibold text-center"
                onClick={() => {
                  setMenuOpen(false);
                  openSignup();
                }}
              >
                {t("nav.sign_up")}
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}