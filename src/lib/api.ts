import { API_BASE_URL } from "./config";
import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredTokens,
} from "./storage";
import type {
  ApiError,
  AuditLog,
  Bookmark,
  BusinessAttribute,
  BusinessClaim,
  BusinessPhoto,
  BusinessReactionType,
  BusinessResponse,
  BusinessSearchParams,
  AnalyticsRange,
  AnalyticsResponse,
  BusinessUpdate,
  BusinessUpdateBody,
  Category,
  City,
  Area,
  Collection,
  CompletenessResponse,
  ConfirmUploadRequestT,
  CreateBusinessRequest,
  FeaturedProduct,
  FeaturedProductBody,
  MenuItem,
  MenuItemBody,
  ServiceOffering,
  ServiceOfferingBody,
  ServiceSection,
  TeamMember,
  TeamMemberBody,
  FakeReviewSignal,
  Message,
  MessageThread,
  ModerationQueueCounts,
  NotificationListResponse,
  PageResponse,
  PreferredLanguage,
  PreSignedUploadResponse,
  RatingBreakdown,
  RecentActivityItem,
  Report,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  Review,
  ReviewResponse,
  ReviewSortOption,
  SubmitReviewRequest,
  TokenPairDto,
  UpdateBusinessRequest,
  UpdateReviewRequest,
  UserProfile,
  UserRole,
  VerificationMethod,
  VisibilityStatus,
  VoteType,
} from "./types";

export class ApiClientError extends Error {
  status: number;
  body: ApiError | null;
  constructor(status: number, message: string, body: ApiError | null) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const pair = (await res.json()) as TokenPairDto;
        setStoredTokens(pair.accessToken, pair.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function broadcastLoggedOut() {
  clearStoredTokens();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rp:auth-invalid"));
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean; // default true — attach Authorization header if a token exists
  isRetry?: boolean;
  rawBody?: boolean; // send `body` as-is (already JSON.stringify'd) instead of re-stringifying
}

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true, isRetry = false, rawBody = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getStoredAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
    method,
    headers,
    body: body === undefined ? undefined : rawBody ? (body as string) : JSON.stringify(body),
  });

  if (res.status === 401 && auth && !isRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, isRetry: true });
    }
    broadcastLoggedOut();
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (payload as ApiError | null)?.message || res.statusText || "Request failed";
    throw new ApiClientError(res.status, message, payload as ApiError | null);
  }

  return payload as T;
}

// ---------------------------------------------------------------------------
// Auth / OTP
// ---------------------------------------------------------------------------
export const authApi = {
  requestOtp: (phoneNumber: string) =>
    request<void>("/api/v1/otp/request", { method: "POST", body: { phoneNumber }, auth: false }),

  register: (phoneNumber: string, code: string, password: string, role: UserRole, name: string) =>
    request<TokenPairDto>("/api/v1/auth/register", {
      method: "POST",
      body: { phoneNumber, code, password, role, name },
      auth: false,
    }),

  // context omitted (or CONSUMER) logs into the personal account; pass
  // BUSINESS_OWNER to log into a linked business account instead — the two
  // are separate accounts (see lib/api.ts's ownerApi for the switch/link flow).
  login: (phoneNumber: string, password: string, context?: UserRole) =>
    request<TokenPairDto>("/api/v1/auth/login", {
      method: "POST",
      body: { phoneNumber, password, context: context ?? null },
      auth: false,
    }),

  resetPassword: (phoneNumber: string, code: string, newPassword: string, role: UserRole) =>
    request<TokenPairDto>("/api/v1/auth/reset-password", {
      method: "POST",
      body: { phoneNumber, code, newPassword, role },
      auth: false,
    }),

  logout: () => request<void>("/api/v1/auth/logout", { method: "POST" }),

  // ---------------------------------------------------------------------
  // Two-account model: consumer + business are separate logins, optionally
  // linked for a frictionless switch (see components/navbar.tsx).
  // ---------------------------------------------------------------------

  /** Frictionless switch to the caller's linked counterpart account — no password re-entry. */
  switchAccount: () => request<TokenPairDto>("/api/v1/auth/switch-account", { method: "POST" }),

  /** Logged-in consumer account creates+links its business-account counterpart in one step. */
  registerBusiness: (password: string, name: string) =>
    request<TokenPairDto>("/api/v1/auth/register-business", {
      method: "POST",
      body: { password, name },
    }),

  /** Links the caller's account with an independently-registered opposite-role account under the same phone, via OTP proof. */
  linkAccounts: (code: string) =>
    request<void>("/api/v1/auth/link-accounts", { method: "POST", body: { code } }),
};

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------
export const userApi = {
  me: () => request<UserProfile>("/api/v1/users/me"),

  update: (name: string | null, preferredLanguage: PreferredLanguage, profilePhotoUrl: string | null) =>
    request<UserProfile>("/api/v1/users/me", {
      method: "PUT",
      body: { name, preferredLanguage, profilePhotoUrl },
    }),

  requestPhotoUploadUrl: (filename: string) =>
    request<PreSignedUploadResponse>("/api/v1/users/me/photo/upload-url", {
      method: "POST",
      query: { filename },
    }),
};

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------
export const referenceApi = {
  cities: () => request<City[]>("/api/v1/cities", { auth: false }),
  areas: (cityId: string) => request<Area[]>(`/api/v1/cities/${cityId}/areas`, { auth: false }),
  categories: () => request<Category[]>("/api/v1/categories", { auth: false }),
  attributes: () => request<BusinessAttribute[]>("/api/v1/attributes", { auth: false }),
};

// ---------------------------------------------------------------------------
// Businesses
// ---------------------------------------------------------------------------
export const businessApi = {
  search: (params: BusinessSearchParams) =>
    request<PageResponse<BusinessResponse>>("/api/v1/businesses/search", {
      auth: false,
      query: { ...params },
    }),

  getBySlug: (slug: string) =>
    request<BusinessResponse>(`/api/v1/businesses/${encodeURIComponent(slug)}`, { auth: false }),

  mine: () => request<BusinessResponse[]>("/api/v1/businesses/mine"),

  /** Free-text pre-check before "add a business" — e.g. "Biriyani House Mirpur" or just "KFC". */
  potentialDuplicates: (q: string) =>
    request<BusinessResponse[]>("/api/v1/businesses/potential-duplicates", {
      auth: false,
      query: { q },
    }),

  create: (body: CreateBusinessRequest) =>
    request<BusinessResponse>("/api/v1/businesses", { method: "POST", body }),

  update: (id: string, body: UpdateBusinessRequest) =>
    request<BusinessResponse>(`/api/v1/businesses/${id}`, { method: "PUT", body }),

  remove: (id: string) => request<void>(`/api/v1/businesses/${id}`, { method: "DELETE" }),

  /** Owner's next step after a flag (report workflow) — notifies every admin, doesn't clear the flag. */
  requestFlagReview: (id: string) =>
    request<void>(`/api/v1/businesses/${id}/flag/request-review`, { method: "POST" }),

  /** Toggles a direct reaction to the business as a whole (business-card reaction row). */
  react: (id: string, reactionType: BusinessReactionType) =>
    request<void>(`/api/v1/businesses/${id}/react`, { method: "POST", body: { reactionType } }),
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const reviewApi = {
  submit: (body: SubmitReviewRequest) =>
    request<ReviewResponse>("/api/v1/reviews", { method: "POST", body }),

  edit: (id: string, body: UpdateReviewRequest) =>
    request<ReviewResponse>(`/api/v1/reviews/${id}`, { method: "PUT", body }),

  remove: (id: string) => request<void>(`/api/v1/reviews/${id}`, { method: "DELETE" }),

  vote: (id: string, voteType: VoteType) =>
    request<void>(`/api/v1/reviews/${id}/vote`, { method: "POST", body: { voteType } }),

  listForBusiness: (businessId: string, page = 0, size = 20, sort: ReviewSortOption = "newest") =>
    request<PageResponse<ReviewResponse>>(`/api/v1/reviews/business/${businessId}`, {
      query: { page, size, sort },
    }),

  ownerDashboard: (businessId: string, page = 0, size = 20) =>
    request<PageResponse<ReviewResponse>>(`/api/v1/reviews/business/${businessId}/dashboard`, {
      query: { page, size },
    }),

  ratingTrend: (businessId: string, bucket: "week" | "month" = "week") =>
    request<unknown[][]>(`/api/v1/reviews/business/${businessId}/rating-trend`, {
      query: { bucket },
    }),

  ratingBreakdown: (businessId: string) =>
    request<RatingBreakdown>(`/api/v1/reviews/business/${businessId}/rating-breakdown`, { auth: false }),

  mine: (page = 0, size = 20) =>
    request<PageResponse<ReviewResponse>>("/api/v1/reviews/mine", { query: { page, size } }),

  mineForBusiness: (businessId: string) =>
    request<ReviewResponse | null>(`/api/v1/reviews/business/${businessId}/mine`),

  recent: (page = 0, size = 9) =>
    request<PageResponse<RecentActivityItem>>("/api/v1/reviews/recent", { auth: false, query: { page, size } }),
};

// ---------------------------------------------------------------------------
// Business claim
// ---------------------------------------------------------------------------
export const claimApi = {
  requestPhone: (businessId: string) =>
    request<void>("/api/v1/claims/phone/request", { method: "POST", body: { businessId } }),

  verifyPhone: (businessId: string, code: string) =>
    request<BusinessClaim>("/api/v1/claims/phone/verify", { method: "POST", body: { businessId, code } }),

  requestEmail: (email: string) =>
    request<void>("/api/v1/claims/email/request", { method: "POST", body: { email } }),

  verifyEmail: (businessId: string, email: string, code: string) =>
    request<BusinessClaim>("/api/v1/claims/email/verify", { method: "POST", body: { businessId, email, code } }),

  documentUploadUrl: (filename: string) =>
    request<PreSignedUploadResponse>("/api/v1/claims/document/upload-url", {
      method: "POST",
      query: { filename },
    }),

  fileDocument: (businessId: string, documentRef: string) =>
    request<BusinessClaim>("/api/v1/claims", {
      method: "POST",
      body: { businessId, verificationMethod: "DOCUMENT" as VerificationMethod, documentRef },
    }),

  documentBlobUrl: async (claimId: string): Promise<string> => {
    const token = getStoredAccessToken();
    const res = await fetch(`${API_BASE_URL}/api/v1/claims/${claimId}/document`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new ApiClientError(res.status, "Failed to load document", null);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  mine: () => request<BusinessClaim[]>("/api/v1/claims/mine"),

  queue: (page = 0, size = 20) =>
    request<PageResponse<BusinessClaim>>("/api/v1/claims/queue", { query: { page, size } }),

  resolve: (id: string, approve: boolean, notes?: string) =>
    request<BusinessClaim>(`/api/v1/claims/${id}/resolve`, {
      method: "POST",
      body: { approve, notes: notes ?? null },
    }),
};

// ---------------------------------------------------------------------------
// Bookmarks / Collections
// ---------------------------------------------------------------------------
export const bookmarkApi = {
  add: (businessId: string, collectionId?: string | null) =>
    request<void>("/api/v1/bookmarks", { method: "POST", body: { businessId, collectionId: collectionId ?? null } }),

  remove: (businessId: string) => request<void>(`/api/v1/bookmarks/${businessId}`, { method: "DELETE" }),

  mine: () => request<Bookmark[]>("/api/v1/bookmarks"),

  createCollection: (name: string) =>
    request<Collection>("/api/v1/collections", { method: "POST", body: { name } }),

  renameCollection: (id: string, name: string) =>
    request<void>(`/api/v1/collections/${id}`, { method: "PUT", body: { name } }),

  deleteCollection: (id: string) => request<void>(`/api/v1/collections/${id}`, { method: "DELETE" }),

  myCollections: () => request<Collection[]>("/api/v1/collections"),

  collectionBookmarks: (id: string) => request<Bookmark[]>(`/api/v1/collections/${id}/bookmarks`),
};

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
export const reportApi = {
  create: (targetType: ReportTargetType, targetId: string, reason: ReportReason) =>
    request<Report>("/api/v1/reports", { method: "POST", body: { targetType, targetId, reason } }),

  queue: (page = 0, size = 20) =>
    request<PageResponse<Report>>("/api/v1/reports/queue", { query: { page, size } }),

  resolve: (id: string, outcome: Exclude<ReportStatus, "PENDING">, resolutionNote?: string) =>
    request<void>(`/api/v1/reports/${id}/resolve`, {
      method: "POST",
      body: { outcome, resolutionNote: resolutionNote ?? null },
    }),
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const notificationApi = {
  list: (page = 0, size = 20) =>
    request<NotificationListResponse>("/api/v1/notifications", { query: { page, size } }),

  markRead: (id: string) => request<void>(`/api/v1/notifications/${id}/read`, { method: "PUT" }),

  markAllRead: () => request<void>("/api/v1/notifications/read-all", { method: "PUT" }),
};

// ---------------------------------------------------------------------------
// Moderation (admin)
// ---------------------------------------------------------------------------
export const moderationApi = {
  summary: () => request<ModerationQueueCounts>("/api/v1/admin/moderation/summary"),

  flaggedReviews: (page = 0, size = 20) =>
    request<PageResponse<Review>>("/api/v1/admin/moderation/flagged-reviews", { query: { page, size } }),

  resolveFlaggedReview: (reviewId: string, resolution: VisibilityStatus, notes?: string) =>
    request<void>(`/api/v1/admin/moderation/flagged-reviews/${reviewId}/resolve`, {
      method: "POST",
      query: { resolution, notes },
    }),

  auditLog: (entityType: string, entityId: string, page = 0, size = 20) =>
    request<PageResponse<AuditLog>>("/api/v1/admin/moderation/audit-log", {
      query: { entityType, entityId, page, size },
    }),
};

// ---------------------------------------------------------------------------
// Fake-review signals (admin)
// ---------------------------------------------------------------------------
export const fakeReviewApi = {
  signalsFor: (reviewId: string) =>
    request<FakeReviewSignal[]>(`/api/v1/admin/fake-review-signals/${reviewId}`),

  reAnalyze: (reviewId: string) =>
    request<void>(`/api/v1/admin/fake-review-signals/${reviewId}/re-analyze`, { method: "POST" }),
};

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------
export const messageApi = {
  send: (businessId: string, content: string) =>
    request<Message>("/api/v1/messages", { method: "POST", body: { businessId, content } }),

  reply: (threadId: string, content: string) =>
    request<Message>(`/api/v1/messages/threads/${threadId}/reply`, { method: "POST", body: { content } }),

  markRead: (threadId: string) =>
    request<void>(`/api/v1/messages/threads/${threadId}/read`, { method: "POST" }),

  history: (threadId: string, page = 0, size = 50) =>
    request<PageResponse<Message>>(`/api/v1/messages/threads/${threadId}`, { query: { page, size } }),

  myThreads: () => request<MessageThread[]>("/api/v1/messages/threads/mine"),

  businessInbox: () => request<MessageThread[]>("/api/v1/messages/threads/business-inbox"),
};

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------
export const galleryApi = {
  requestUploadUrl: (businessId: string, filename: string) =>
    request<PreSignedUploadResponse>(`/api/v1/businesses/${businessId}/photos/upload-url`, {
      method: "POST",
      query: { filename },
    }),

  confirm: (businessId: string, cdnUrl: string) =>
    request<BusinessPhoto>(`/api/v1/businesses/${businessId}/photos/confirm`, {
      method: "POST",
      body: { businessId, cdnUrl } satisfies ConfirmUploadRequestT,
    }),

  remove: (businessId: string, photoId: string) =>
    request<void>(`/api/v1/businesses/${businessId}/photos/${photoId}`, { method: "DELETE" }),

  /** Persist a new gallery order — `orderedPhotoIds` must list every current photo id exactly once. */
  reorder: (businessId: string, orderedPhotoIds: string[]) =>
    request<BusinessPhoto[]>(`/api/v1/businesses/${businessId}/photos/reorder`, {
      method: "PATCH",
      body: { orderedPhotoIds },
    }),

  list: (businessId: string) =>
    request<BusinessPhoto[]>(`/api/v1/businesses/${businessId}/photos`, { auth: false }),
};

// ---------------------------------------------------------------------------
// Phase 2 — category showcase modules (services / team / menu / products).
// GET is public; writes are owner-scoped. Each list is fetched on demand
// (never bundled into GET /businesses/{slug}).
// ---------------------------------------------------------------------------
export const catalogApi = {
  // Services — also gym membership (section OFFERING) and gym facilities (section FACILITY).
  services: (businessId: string, section?: ServiceSection) =>
    request<ServiceOffering[]>(`/api/v1/businesses/${businessId}/services`, { auth: false, query: { section } }),
  addService: (businessId: string, body: ServiceOfferingBody) =>
    request<ServiceOffering>(`/api/v1/businesses/${businessId}/services`, { method: "POST", body }),
  updateService: (businessId: string, id: string, body: ServiceOfferingBody) =>
    request<ServiceOffering>(`/api/v1/businesses/${businessId}/services/${id}`, { method: "PUT", body }),
  removeService: (businessId: string, id: string) =>
    request<void>(`/api/v1/businesses/${businessId}/services/${id}`, { method: "DELETE" }),
  reorderServices: (businessId: string, orderedIds: string[], section?: ServiceSection) =>
    request<ServiceOffering[]>(`/api/v1/businesses/${businessId}/services/reorder`, {
      method: "PATCH",
      body: { orderedIds },
      query: { section },
    }),

  // Team — doctors / staff / trainers.
  team: (businessId: string) =>
    request<TeamMember[]>(`/api/v1/businesses/${businessId}/team`, { auth: false }),
  addTeamMember: (businessId: string, body: TeamMemberBody) =>
    request<TeamMember>(`/api/v1/businesses/${businessId}/team`, { method: "POST", body }),
  updateTeamMember: (businessId: string, id: string, body: TeamMemberBody) =>
    request<TeamMember>(`/api/v1/businesses/${businessId}/team/${id}`, { method: "PUT", body }),
  removeTeamMember: (businessId: string, id: string) =>
    request<void>(`/api/v1/businesses/${businessId}/team/${id}`, { method: "DELETE" }),
  reorderTeam: (businessId: string, orderedIds: string[]) =>
    request<TeamMember[]>(`/api/v1/businesses/${businessId}/team/reorder`, { method: "PATCH", body: { orderedIds } }),

  // Menu — restaurant.
  menuItems: (businessId: string) =>
    request<MenuItem[]>(`/api/v1/businesses/${businessId}/menu-items`, { auth: false }),
  addMenuItem: (businessId: string, body: MenuItemBody) =>
    request<MenuItem>(`/api/v1/businesses/${businessId}/menu-items`, { method: "POST", body }),
  updateMenuItem: (businessId: string, id: string, body: MenuItemBody) =>
    request<MenuItem>(`/api/v1/businesses/${businessId}/menu-items/${id}`, { method: "PUT", body }),
  removeMenuItem: (businessId: string, id: string) =>
    request<void>(`/api/v1/businesses/${businessId}/menu-items/${id}`, { method: "DELETE" }),
  reorderMenuItems: (businessId: string, orderedIds: string[]) =>
    request<MenuItem[]>(`/api/v1/businesses/${businessId}/menu-items/reorder`, { method: "PATCH", body: { orderedIds } }),

  // Featured products — retail.
  products: (businessId: string) =>
    request<FeaturedProduct[]>(`/api/v1/businesses/${businessId}/products`, { auth: false }),
  addProduct: (businessId: string, body: FeaturedProductBody) =>
    request<FeaturedProduct>(`/api/v1/businesses/${businessId}/products`, { method: "POST", body }),
  updateProduct: (businessId: string, id: string, body: FeaturedProductBody) =>
    request<FeaturedProduct>(`/api/v1/businesses/${businessId}/products/${id}`, { method: "PUT", body }),
  removeProduct: (businessId: string, id: string) =>
    request<void>(`/api/v1/businesses/${businessId}/products/${id}`, { method: "DELETE" }),
  reorderProducts: (businessId: string, orderedIds: string[]) =>
    request<FeaturedProduct[]>(`/api/v1/businesses/${businessId}/products/reorder`, { method: "PATCH", body: { orderedIds } }),
};

// ---------------------------------------------------------------------------
// Phase 3 — business updates (owner CRUD + public list)
// ---------------------------------------------------------------------------
export const updatesApi = {
  publicList: (businessId: string, page = 0, size = 10) =>
    request<PageResponse<BusinessUpdate>>(`/api/v1/businesses/${businessId}/updates`, {
      auth: false,
      query: { page, size },
    }),
  manageList: (businessId: string, page = 0, size = 20) =>
    request<PageResponse<BusinessUpdate>>(`/api/v1/businesses/${businessId}/updates/manage`, { query: { page, size } }),
  create: (businessId: string, body: BusinessUpdateBody) =>
    request<BusinessUpdate>(`/api/v1/businesses/${businessId}/updates`, { method: "POST", body }),
  update: (businessId: string, id: string, body: BusinessUpdateBody) =>
    request<BusinessUpdate>(`/api/v1/businesses/${businessId}/updates/${id}`, { method: "PUT", body }),
  setPublished: (businessId: string, id: string, published: boolean) =>
    request<BusinessUpdate>(`/api/v1/businesses/${businessId}/updates/${id}/publish`, {
      method: "PATCH",
      body: { published },
    }),
  remove: (businessId: string, id: string) =>
    request<void>(`/api/v1/businesses/${businessId}/updates/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Phase 3 — analytics (owner/admin read; the write path is lib/analytics.ts sendBeacon)
// ---------------------------------------------------------------------------
export const analyticsApi = {
  get: (businessId: string, range: AnalyticsRange = "30d") =>
    request<AnalyticsResponse>(`/api/v1/businesses/${businessId}/analytics`, { query: { range } }),
};

// ---------------------------------------------------------------------------
// Phase 3 — profile completeness (owner/admin)
// ---------------------------------------------------------------------------
export const completenessApi = {
  get: (businessId: string) =>
    request<CompletenessResponse>(`/api/v1/businesses/${businessId}/completeness`),
};

/**
 * Direct-to-storage upload for the pre-signed URL flow (spec §13). In
 * local/dev deployments the URL points at the backend's own local-disk
 * StorageController; swap ObjectStorageClient for a real S3/R2 client
 * server-side to point this at a real bucket in prod.
 */
export async function uploadFileToPresignedUrl(uploadUrl: string, file: File): Promise<boolean> {
  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    return res.ok;
  } catch {
    return false;
  }
}