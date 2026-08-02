# Jachai — Frontend

A Next.js 14 (App Router) + TypeScript + Tailwind CSS frontend built to match
the `business-review-backend` Spring Boot API (and, indirectly, the
`ml-service` FastAPI/LangGraph service that backend calls internally — the
frontend never talks to ml-service directly).

Every endpoint, DTO, and entity in the backend was read directly from source
to build this — see "API surface covered" below for the full map, and "Known
backend gaps" for the handful of places where the frontend had to work
around something the backend doesn't yet expose.

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local — set NEXT_PUBLIC_API_BASE_URL to your backend's URL
npm run dev
```

Runs on `http://localhost:3000` by default. The backend is expected at
`http://localhost:8080` unless you change `NEXT_PUBLIC_API_BASE_URL`.

### ⚠️ CORS — you will need to enable it on the backend

`SecurityConfig` in the backend does not register a `CorsConfigurationSource`
or call `.cors(...)` on the `HttpSecurity` builder. Without that, the browser
will block cross-origin requests from `localhost:3000` → `localhost:8080`
(the `Authorization` header on most calls forces a CORS preflight, and
there's currently nothing to answer it). Add something like this to the
backend before running the two together:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:3000"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

...and call `.cors(cors -> cors.configurationSource(corsConfigurationSource()))`
in the `SecurityFilterChain` bean.

## Architecture

- **Auth**: OTP-based, no passwords. `POST /otp/request` → `POST /otp/verify`
  returns a JWT access token + opaque refresh token. There's no `/me`
  endpoint, so the frontend decodes the JWT client-side (`lib/jwt.ts`) to get
  the user's id and role. `lib/api.ts` auto-refreshes on a 401 and retries
  the request once; if refresh also fails, it broadcasts a `rp:auth-invalid`
  window event that `AuthProvider` listens for.
- **State**: no global state library — React context for auth
  (`lib/auth-context.tsx`) and toasts (`lib/toast-context.tsx`), otherwise
  local component state + fetch-on-mount. Every page that needs data is a
  client component (`"use client"`), since almost everything here is
  personalized or behind auth.
- **Styling**: Tailwind with a custom token set in `tailwind.config.ts` — a
  deep verification-green (`brand`) + trust-gold (`gold`) palette, built
  around the NID-verification "seal" as the platform's signature visual
  element (see `components/verified-badge.tsx` and the logo mark in
  `components/navbar.tsx`), deliberately avoiding the generic
  cream-and-terracotta AI-template look.
- **API client**: `lib/api.ts` is a single typed client covering all ~40
  endpoints, grouped by resource (`authApi`, `businessApi`, `reviewApi`,
  `summaryApi`, `nidApi`, `claimApi`, `bookmarkApi`, `reportApi`,
  `moderationApi`, `fakeReviewApi`, `messageApi`, `galleryApi`,
  `referenceApi`).

## API surface covered

Every controller in `com.bdreview.platform.*` has a corresponding client
method and at least one page/component calling it:

| Backend area | Frontend |
|---|---|
| OTP + auth (`/otp/*`, `/auth/*`) | `/login` |
| Reference data (`/cities`, `/categories`, `/attributes`) | filters, business form |
| Business CRUD + search (`/businesses/*`) | `/`, `/business/[slug]`, `/owner`, `/owner/new`, `/owner/[id]/edit` |
| Reviews (`/reviews/*`) | `/business/[slug]`, `/me/reviews`, `/owner/[id]/dashboard` |
| AI summary (`/businesses/{id}/summary`) | `components/ai-summary-card.tsx`, owner dashboard regenerate button |
| NID verification (`/nid-verifications/*`) | `/owner/[id]/dashboard` (submit + history), `/admin/nid-queue` (resolve) |
| Business claims (`/claims/*`) | `/business/[slug]` (file claim), `/admin/claims` (resolve) |
| Bookmarks/collections (`/bookmarks`, `/collections`) | `/me/bookmarks`, `components/bookmark-button.tsx` |
| Reports (`/reports/*`) | `components/report-button.tsx`, `/admin/reports` |
| Moderation (`/admin/moderation/*`) | `/admin`, `/admin/flagged-reviews`, `/admin/audit-log` |
| Fake-review signals (`/admin/fake-review-signals/*`) | drill-down panel inside `/admin/flagged-reviews` |
| Messaging (`/messages/*`) | `/me/messages`, `/owner/inbox`, `components/message-thread-view.tsx` |
| Gallery (`/businesses/{id}/photos/*`) | `/owner/[id]/dashboard` (Gallery tab), review photo upload |

## Known backend gaps (worked around in the frontend, but worth fixing server-side)

1. **No "get business by ID" endpoint.** `BusinessController` only exposes
   lookup by slug. But `Bookmark`, `MessageThread`, `Review`, etc. all store
   a raw `businessId` UUID with no name/slug attached. Workaround:
   `lib/business-cache.ts` mirrors every full `BusinessResponse` the app
   sees (search results, profile views) into `localStorage` keyed by id, and
   screens like `/me/bookmarks` and `/me/messages` look names up from there.
   If a business was bookmarked before ever being viewed in this browser (or
   the cache was cleared), the UI falls back to showing a truncated id.
   **Fix**: add `GET /api/v1/businesses/by-id/{id}` (or similar) and this
   whole cache layer becomes unnecessary.

2. **No dedicated review-photo upload endpoint.** The folder convention in
   the spec mentions `review/{review_id}/...`, and `ReviewPhoto`/
   `ReviewPhotoRepository` exist, but there's no `ReviewPhotoController`.
   `SubmitReviewRequest.photoUrls` expects URLs to already exist somewhere.
   Workaround: `components/review-form.tsx` reuses the business gallery's
   pre-signed-upload-URL flow (scoped to the business being reviewed) to get
   a working upload experience. **Fix**: add a proper review-photo upload
   endpoint.

3. **No secure NID image upload endpoint.** `SubmitNidRequest` expects an
   `encryptedImageRef` already pointing into KMS-backed storage, but nothing
   in the codebase produces one — there's no NID-specific
   `ObjectStorageClient` usage or controller. Workaround: the NID
   verification form in `/owner/[id]/dashboard` base64-encodes the file
   client-side and submits a truncated version of that as a placeholder ref,
   with a visible warning that this is **not** real encryption-at-rest.
   **Fix**: add a real server-side upload endpoint that encrypts with
   AES-256 via KMS per spec §8 before this goes anywhere near production.

4. **Owners can't cold-start a reply thread.** `MessageService.send()`
   explicitly throws if the sender is the business owner and no thread
   exists yet with that consumer — owners can only `reply` inside an
   existing thread. So "reply to a review" (spec §7) only works once the
   reviewer has messaged the owner at least once through the normal
   consumer→owner channel. The owner dashboard's Reviews tab reflects this
   honestly: it shows a "Reply via message thread" link only when a
   matching thread already exists, and an explanatory disabled state
   otherwise, rather than pretending the flow always works.

5. **A couple of admin endpoints don't enforce the ADMIN role server-side.**
   `NidVerificationController.resolve()` and `BusinessClaimController.resolve()`
   don't call `CurrentUser.requireRole("ADMIN")` the way most other
   admin-only endpoints do. The frontend still gates these behind
   `RoleGate allow={["ADMIN"]}`, but that's a client-side convenience, not a
   security boundary — worth adding the same role check the other admin
   endpoints already have.

6. **`ratingTrend` returns raw `Object[]` rows** with no field names in the
   JSON. `components/rating-trend-chart.tsx` defensively reads index `0` as
   the bucket label and index `1` as the average rating — confirm this
   matches the actual SQL projection order server-side.

7. **Audit log is per-entity, not a global feed.** `GET
   /admin/moderation/audit-log` requires `entityType` + `entityId` query
   params — there's no "show me everything recent" endpoint.
   `/admin/audit-log` is built as a lookup tool (paste in an id you found
   elsewhere) rather than a scrollable feed, since that's what the API
   actually supports.

## What's intentionally not built

- A drag-to-pin interactive map for the owner-side location picker (spec
  §17a) — the business form takes lat/lng directly (with a "use my current
  location" button) rather than embedding Google Maps JS/Leaflet, to avoid
  pulling in a maps SDK and API key requirement for this pass. The
  consumer-side static-map + deep-link handoff (spec §17b) *is* fully built
  (`components/map-preview.tsx`).
- Android/iOS apps — spec says these come later on the same backend APIs;
  this delivers the web client only.
