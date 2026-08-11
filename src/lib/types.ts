// Types below mirror the Java records/entities in the Spring Boot backend
// (com.bdreview.platform.*) field-for-field, so JSON responses map straight
// through without any renaming layer.

export type UserRole = "CONSUMER" | "BUSINESS_OWNER" | "ADMIN";

export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
}

export interface DecodedAccessToken {
  sub: string; // user id (UUID)
  role: UserRole;
  iat: number;
  exp: number;
}

export type PreferredLanguage = "en" | "bn";

export interface UserProfile {
  id: string;
  phoneNumber: string;
  role: UserRole;
  name: string | null;
  profilePhotoUrl: string | null;
  preferredLanguage: PreferredLanguage;
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------
export interface City {
  id: string;
  name: string;
}

export interface Area {
  id: string;
  name: string;
  city?: City;
}

export interface Category {
  id: string;
  name: string;
}

export interface BusinessAttribute {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Business
// ---------------------------------------------------------------------------
export type PriceTier = "BUDGET" | "MODERATE" | "EXPENSIVE" | "VERY_EXPENSIVE";

export interface BusinessResponse {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  cityName: string;
  areaName: string;
  contactNumber: string;
  operatingHours: string | null;
  description: string | null;
  coverPhotoUrl: string | null;
  latitude: number;
  longitude: number;
  priceTier: PriceTier;
  attributes: string[];
  verified: boolean;
  averageRating: number;
  reviewCount: number;
  // Set when a LISTING report against this business is resolved ACTION_TAKEN — a visible,
  // Yelp-style "consumer alert" with the report's reason, not a takedown (see report workflow).
  flagged: boolean;
  flagReason: ReportReason | null;
  flaggedAt: string | null;
}

export interface CreateBusinessRequest {
  name: string;
  categoryId: string;
  cityId: string;
  areaId: string;
  contactNumber: string;
  operatingHours?: string | null;
  description?: string | null;
  coverPhotoUrl?: string | null;
  latitude: number;
  longitude: number;
  priceTier: PriceTier;
  attributeIds: string[];
}

export type UpdateBusinessRequest = CreateBusinessRequest;

export type SortOption = "rating" | "distance" | "newest" | "most_reviewed";

export interface BusinessSearchParams {
  categoryId?: string;
  areaId?: string;
  priceTier?: PriceTier;
  minRating?: number;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  sort?: SortOption;
  page?: number;
  size?: number;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export type VisibilityStatus = "RECOMMENDED" | "NOT_RECOMMENDED" | "HIDDEN";
export type VoteType = "USEFUL" | "FUNNY" | "COOL";

export interface ReviewResponse {
  id: string;
  businessId: string;
  userId: string;
  userName: string | null;
  rating: number;
  content: string | null;
  visibilityStatus: VisibilityStatus;
  usefulCount: number;
  funnyCount: number;
  coolCount: number;
  editable: boolean;
  photoUrls: string[];
  createdAt: string;
}

// Shape returned by the admin moderation "flagged reviews" endpoint
// (com.bdreview.platform.moderation.FlaggedReviewResponse) — thinner than
// ReviewResponse, no photo URLs resolved.
export interface Review {
  id: string;
  businessId: string;
  userId: string;
  userName: string | null;
  rating: number;
  content: string | null;
  visibilityStatus: VisibilityStatus;
  suspicionScore: number;
  usefulCount: number;
  funnyCount: number;
  coolCount: number;
  createdAt: string;
}

export interface SubmitReviewRequest {
  businessId: string;
  rating: number;
  content: string;
  photoUrls: string[];
}

export interface UpdateReviewRequest {
  rating: number;
  content: string;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
export interface BusinessReviewSummary {
  id: string;
  businessId: string;
  summaryText: string;
  reviewCountAtGeneration: number;
  generatedAt: string;
  version: number;
}

// ---------------------------------------------------------------------------
// NID verification
// ---------------------------------------------------------------------------
export type NidVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface NidVerification {
  id: string;
  businessId: string;
  ownerUserId: string;
  encryptedImageRef: string;
  status: NidVerificationStatus;
  resolvedByAdminId: string | null;
  resolvedAt: string | null;
  imagePurgeAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Business claim
// ---------------------------------------------------------------------------
export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";
export type VerificationMethod = "PHONE" | "NID";

export interface BusinessClaim {
  id: string;
  businessId: string;
  claimantUserId: string;
  claimantName: string | null;
  verificationMethod: VerificationMethod;
  status: ClaimStatus;
  createdAt: string;
  resolvedAt: string | null;
}

// ---------------------------------------------------------------------------
// Bookmarks / Collections
// ---------------------------------------------------------------------------
export interface Bookmark {
  id: string;
  userId: string;
  businessId: string;
  collectionId: string | null;
  createdAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
export type ReportTargetType = "REVIEW" | "LISTING";
export type ReportReason = "SPAM" | "FAKE" | "OFFENSIVE" | "OTHER";
// PENDING is the only non-terminal value; the other three are resolution
// outcomes an admin chooses on resolve — see ResolveReportRequest below.
export type ReportStatus = "PENDING" | "ACTION_TAKEN" | "DISMISSED" | "DUPLICATE";
export type ReportPriority = "HIGH" | "NORMAL";

export interface Report {
  id: string;
  reporterUserId: string;
  reporterName: string | null;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  status: ReportStatus;
  referenceCode: string;
  resolutionNote: string | null;
  reporterNotifiedAt: string | null;
  targetOwnerNotifiedAt: string | null;
  priority: ReportPriority;
  dueAt: string;
  isOverdue: boolean;
  createdAt: string;
}

/** outcome must be ACTION_TAKEN, DISMISSED, or DUPLICATE — never PENDING (rejected server-side). */
export interface ResolveReportRequest {
  outcome: Exclude<ReportStatus, "PENDING">;
  resolutionNote?: string | null;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export type NotificationType =
  | "REPORT_SUBMITTED"
  | "REPORT_ACTION_TAKEN"
  | "REPORT_DISMISSED"
  | "CONTENT_HIDDEN"
  | "LISTING_FLAGGED";
export type NotificationChannel = "SMS" | "IN_APP";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ";

export interface Notification {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationListResponse {
  notifications: PageResponse<Notification>;
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// Moderation / audit
// ---------------------------------------------------------------------------
export interface ModerationQueueCounts {
  pendingReports: number;
  pendingNidVerifications: number;
  flaggedReviews: number;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedByAdmin: string;
  notes: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Fake-review signals
// ---------------------------------------------------------------------------
export type FakeReviewSignalType =
  | "CONTENT_PATTERN"
  | "TIMING_PATTERN"
  | "RATING_CLUSTERING";

export interface FakeReviewSignal {
  id: string;
  reviewId: string;
  signalType: FakeReviewSignalType;
  score: number;
  detail: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------
export interface MessageThread {
  id: string;
  consumerUserId: string;
  consumerName: string | null;
  businessId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderUserId: string;
  senderName: string | null;
  content: string;
  readAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------
export interface PreSignedUploadResponse {
  uploadUrl: string;
  objectKey: string;
  cdnUrlAfterUpload: string;
}

export interface ConfirmUploadRequestT {
  businessId: string;
  cdnUrl: string;
}

export interface BusinessPhoto {
  id: string;
  businessId: string;
  url: string;
  sortOrder: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Paging + errors
// ---------------------------------------------------------------------------
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

// Lightweight local cache entry used to bridge gaps where the backend
// returns only a businessId with no name/slug/photo attached (bookmarks,
// message threads). Populated opportunistically whenever a full
// BusinessResponse passes through the app. See lib/business-cache.ts.
export interface CachedBusinessSummary {
  id: string;
  name: string;
  slug: string;
  coverPhotoUrl: string | null;
  categoryName: string;
  areaName: string;
  cityName: string;
}
