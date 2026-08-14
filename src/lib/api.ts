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
  BusinessReviewSummary,
  BusinessSearchParams,
  Category,
  City,
  Area,
  Collection,
  ConfirmUploadRequestT,
  CreateBusinessRequest,
  FakeReviewSignal,
  Message,
  MessageThread,
  ModerationQueueCounts,
  NidVerification,
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

  login: (phoneNumber: string, password: string) =>
    request<TokenPairDto>("/api/v1/auth/login", {
      method: "POST",
      body: { phoneNumber, password },
      auth: false,
    }),

  resetPassword: (phoneNumber: string, code: string, newPassword: string) =>
    request<TokenPairDto>("/api/v1/auth/reset-password", {
      method: "POST",
      body: { phoneNumber, code, newPassword },
      auth: false,
    }),

  logout: () => request<void>("/api/v1/auth/logout", { method: "POST" }),
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

  recent: (page = 0, size = 9) =>
    request<PageResponse<RecentActivityItem>>("/api/v1/reviews/recent", { auth: false, query: { page, size } }),
};

// ---------------------------------------------------------------------------
// AI Summary
// ---------------------------------------------------------------------------
export const summaryApi = {
  get: (businessId: string) =>
    request<BusinessReviewSummary>(`/api/v1/businesses/${businessId}/summary`, { auth: false }),

  regenerate: (businessId: string) =>
    request<void>(`/api/v1/businesses/${businessId}/summary/regenerate`, { method: "POST" }),
};

// ---------------------------------------------------------------------------
// NID verification
// ---------------------------------------------------------------------------
export const nidApi = {
  submit: (businessId: string, encryptedImageRef: string) =>
    request<NidVerification>("/api/v1/nid-verifications", {
      method: "POST",
      body: { businessId, encryptedImageRef },
    }),

  history: (businessId: string) =>
    request<NidVerification[]>(`/api/v1/nid-verifications/business/${businessId}`),

  queue: (page = 0, size = 20) =>
    request<PageResponse<NidVerification>>("/api/v1/nid-verifications/queue", {
      query: { page, size },
    }),

  resolve: (id: string, approve: boolean, notes?: string) =>
    request<void>(`/api/v1/nid-verifications/${id}/resolve`, {
      method: "POST",
      body: { approve, notes: notes ?? null },
    }),
};

// ---------------------------------------------------------------------------
// Business claim
// ---------------------------------------------------------------------------
export const claimApi = {
  file: (businessId: string, verificationMethod: VerificationMethod) =>
    request<BusinessClaim>("/api/v1/claims", { method: "POST", body: { businessId, verificationMethod } }),

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

  list: (businessId: string) =>
    request<BusinessPhoto[]>(`/api/v1/businesses/${businessId}/photos`, { auth: false }),
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