"use client";

import { useState, type ReactNode } from "react";
import { Globe, Mail } from "lucide-react";
import { getOpenStatus } from "@/lib/business-hours";
import type { BusinessResponse } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { cn, focusRing, interactiveTransition } from "@/lib/utils";
import { Facebook, Instagram, WhatsApp } from "./icons/brand";

const ABOUT_PREVIEW_LENGTH = 280;

function AboutText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > ABOUT_PREVIEW_LENGTH;
  const shown = expanded || !isLong ? text : `${text.slice(0, ABOUT_PREVIEW_LENGTH).trimEnd()}…`;

  return (
    <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">
      {shown}
      {isLong && !expanded && (
        <>
          {" "}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="font-semibold text-crimson-700 hover:underline"
          >
            Read more
          </button>
        </>
      )}
    </p>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-ink-700">
      <span className="mt-0.5 flex-none text-ink-400">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

/** Digits-only, for wa.me/<number> links. */
function waLink(raw: string) {
  return `https://wa.me/${raw.replace(/[^0-9]/g, "")}`;
}

/** Adds a scheme if the owner typed a bare domain, so the anchor is valid. */
function externalHref(raw: string) {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

/** One glyph in the SocialLinks row — 44px hit area, brand-icon-or-Lucide inside a neutral circle. */
function SocialIconLink({
  href,
  label,
  external = true,
  onClick,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-11 items-center justify-center rounded-full bg-ink-100 text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700",
        interactiveTransition,
        focusRing
      )}
    >
      {children}
    </a>
  );
}

/**
 * "About" section (spec) — renders only the information that exists. No empty
 * fields, no empty cards. Fed entirely from the single business response, so
 * this adds no network request.
 */
export function BusinessAbout({ business }: { business: BusinessResponse }) {
  const {
    id,
    name,
    description,
    contactNumber,
    whatsappNumber,
    email,
    websiteUrl,
    facebookUrl,
    instagramUrl,
    operatingHours,
    structuredHours,
    hoursExceptions,
    attributes,
  } = business;

  const openStatus = getOpenStatus(structuredHours, hoursExceptions);

  const hasContact =
    !!contactNumber || !!whatsappNumber || !!email || !!websiteUrl || !!facebookUrl || !!instagramUrl;

  return (
    <div className="space-y-6">
      {description && (
        <section>
          <h2 className="font-display text-lg font-semibold text-ink-900 mb-2">About the Business</h2>
          <AboutText text={description} />
        </section>
      )}

      {hasContact && (
        <section>
          <h2 className="font-display text-lg font-semibold text-ink-900 mb-3">Contact &amp; links</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {contactNumber && (
              <Row
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C9.5 21 3 14.5 3 6a2 2 0 0 1 1-2Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              >
                <a
                  href={`tel:${contactNumber}`}
                  onClick={() => trackEvent(id, "PHONE_CLICK")}
                  className="hover:text-crimson-700"
                >
                  {contactNumber}
                </a>
              </Row>
            )}

          </div>

          {(whatsappNumber || email || websiteUrl || facebookUrl || instagramUrl) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {whatsappNumber && (
                <SocialIconLink
                  href={waLink(whatsappNumber)}
                  label={`Open ${name} on WhatsApp (new tab)`}
                  onClick={() => trackEvent(id, "WHATSAPP_CLICK")}
                >
                  <WhatsApp className="h-5 w-5" />
                </SocialIconLink>
              )}
              {email && (
                <SocialIconLink href={`mailto:${email}`} label={`Email ${name}`} external={false}>
                  <Mail size={20} strokeWidth={1.75} />
                </SocialIconLink>
              )}
              {websiteUrl && (
                <SocialIconLink
                  href={externalHref(websiteUrl)}
                  label={`Open ${name}'s website (new tab)`}
                  onClick={() => trackEvent(id, "WEBSITE_CLICK")}
                >
                  <Globe size={20} strokeWidth={1.75} />
                </SocialIconLink>
              )}
              {facebookUrl && (
                <SocialIconLink href={externalHref(facebookUrl)} label={`Open ${name} on Facebook (new tab)`}>
                  <Facebook className="h-5 w-5" />
                </SocialIconLink>
              )}
              {instagramUrl && (
                <SocialIconLink href={externalHref(instagramUrl)} label={`Open ${name} on Instagram (new tab)`}>
                  <Instagram className="h-5 w-5" />
                </SocialIconLink>
              )}
            </div>
          )}
        </section>
      )}

      {operatingHours && (
        <section>
          <h2 className="font-display text-lg font-semibold text-ink-900 mb-2 flex items-center gap-2">
            Hours
            {openStatus && (
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold " +
                  (openStatus.open ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-600")
                }
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {openStatus.open ? "Open now" : "Closed"}
                {openStatus.changesAt && ` · ${openStatus.open ? "until" : "opens"} ${openStatus.changesAt}`}
              </span>
            )}
          </h2>
          <div className="flex items-start gap-2.5 text-sm text-ink-700">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-none text-ink-400" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="whitespace-pre-wrap">{operatingHours}</span>
          </div>
        </section>
      )}

      {attributes.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-ink-900 mb-3">Amenities and More</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
            {attributes.map((attr) => (
              <div key={attr} className="flex items-center gap-2 text-sm text-ink-700">
                <svg viewBox="0 0 20 20" className="h-4 w-4 flex-none text-ink-600" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 10.5 8 14l8-8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {attr}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
