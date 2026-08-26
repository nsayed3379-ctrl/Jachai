"use client";

import { useState } from "react";
import type { BusinessResponse } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

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

/**
 * "About" section (spec) — renders only the information that exists. No empty
 * fields, no empty cards. Fed entirely from the single business response, so
 * this adds no network request.
 */
export function BusinessAbout({ business }: { business: BusinessResponse }) {
  const {
    id,
    description,
    contactNumber,
    whatsappNumber,
    email,
    websiteUrl,
    facebookUrl,
    instagramUrl,
    operatingHours,
    attributes,
  } = business;

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

            {whatsappNumber && (
              <Row
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.3A8.5 8.5 0 1 1 21 11.5Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              >
                <a
                  href={waLink(whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent(id, "WHATSAPP_CLICK")}
                  className="hover:text-crimson-700"
                >
                  WhatsApp {whatsappNumber}
                </a>
              </Row>
            )}

            {email && (
              <Row
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              >
                <a href={`mailto:${email}`} className="hover:text-crimson-700 break-all">
                  {email}
                </a>
              </Row>
            )}

            {websiteUrl && (
              <Row
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              >
                <a
                  href={externalHref(websiteUrl)}
                  target="_blank"
                  rel="noopener nofollow noreferrer"
                  onClick={() => trackEvent(id, "WEBSITE_CLICK")}
                  className="hover:text-crimson-700 break-all"
                >
                  {websiteUrl.replace(/^https?:\/\//i, "")}
                </a>
              </Row>
            )}

            {facebookUrl && (
              <Row
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.87.24-1.46 1.5-1.46H17V4.06C16.7 4.02 15.8 3.93 14.76 3.93c-2.17 0-3.66 1.32-3.66 3.75V10H8.4v3h2.7v8Z" />
                  </svg>
                }
              >
                <a href={externalHref(facebookUrl)} target="_blank" rel="noopener noreferrer" className="hover:text-crimson-700">
                  Facebook
                </a>
              </Row>
            )}

            {instagramUrl && (
              <Row
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                }
              >
                <a href={externalHref(instagramUrl)} target="_blank" rel="noopener noreferrer" className="hover:text-crimson-700">
                  Instagram
                </a>
              </Row>
            )}
          </div>
        </section>
      )}

      {operatingHours && (
        <section>
          <h2 className="font-display text-lg font-semibold text-ink-900 mb-2">Hours</h2>
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
