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
  /** Whether this account is paired with an opposite-role account (consumer<->business) — drives the switcher in the nav. */
  hasLinkedAccount: boolean;
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

/** Phase 2 — canonical driver of category-specific modules. Free-text category name is unchanged. */
export type CategoryKind = "RESTAURANT" | "CLINIC" | "SALON" | "RETAIL" | "GYM" | "GENERAL";

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
}

export interface BusinessAttribute {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Business
// ---------------------------------------------------------------------------
export type PriceTier = "BUDGET" | "MODERATE" | "EXPENSIVE" | "VERY_EXPENSIVE";

// Business-card reaction row — distinct from VoteType, which is a per-review
// useful/funny/cool vote (see VoteType below).
export type BusinessReactionType = "LIKE" | "DISLIKE" | "LOVE" | "WOW";

export interface BusinessResponse {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  categoryName: string;
  cityName: string;
  areaName: string;
  contactNumber: string;
  operatingHours: string | null;
  description: string | null;
  coverPhotoUrl: string | null;
  logoUrl: string | null;
  // "Business presence" (spec Step 4) — optional contact/social links. Null when unset;
  // an empty value is never rendered on the public page.
  websiteUrl: string | null;
  whatsappNumber: string | null;
  email: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  // Cover photo (if any) followed by gallery photos, in display order — card carousel source.
  photoUrls: string[];
  latitude: number;
  longitude: number;
  priceTier: PriceTier;
  attributes: string[];
  verified: boolean;
  // True once a real (non-admin) owner has claimed this listing — see the claim flow.
  claimed: boolean;
  averageRating: number;
  reviewCount: number;
  // Set when a LISTING report against this business is resolved ACTION_TAKEN — a visible,
  // Yelp-style "consumer alert" with the report's reason, not a takedown (see report workflow).
  flagged: boolean;
  flagReason: ReportReason | null;
  flaggedAt: string | null;
  // Business-card reaction totals (Like/Dislike/Love/Wow) — a direct reaction
  // to the business as a whole, not derived from review votes.
  totalLikeCount: number;
  totalDislikeCount: number;
  totalLoveCount: number;
  totalWowCount: number;
  // Phase 2 — canonical category classification, drives which module tabs appear.
  categoryKind: CategoryKind;
  // Which category modules actually have data. Populated only on GET /businesses/{slug}
  // (the detail view); null on search/list/mine results. Each tab then fetches its own list.
  categoryModules: CategoryModuleFlags | null;
  // Phase 3 — true if the listing has ≥1 published update. Detail response only; null on lists.
  hasUpdates: boolean | null;
}

// ---------------------------------------------------------------------------
// Phase 2 — category-specific showcase modules
// ---------------------------------------------------------------------------
export interface CategoryModuleFlags {
  hasOfferings: boolean;
  hasFacilities: boolean;
  hasTeam: boolean;
  hasMenu: boolean;
  hasProducts: boolean;
}

/** OFFERING = services / gym membership plans; FACILITY = gym amenity names. */
export type ServiceSection = "OFFERING" | "FACILITY";

export interface ServiceOffering {
  id: string;
  businessId: string;
  section: ServiceSection;
  name: string;
  description: string | null;
  priceText: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  businessId: string;
  name: string;
  role: string | null;
  bio: string | null;
  photoUrl: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  businessId: string;
  menuSection: string | null;
  name: string;
  description: string | null;
  priceText: string | null;
  photoUrl: string | null;
  popular: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface FeaturedProduct {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  priceText: string | null;
  photoUrl: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface ServiceOfferingBody {
  name: string;
  description?: string | null;
  priceText?: string | null;
  section?: ServiceSection;
}
export interface TeamMemberBody {
  name: string;
  role?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
}
export interface MenuItemBody {
  name: string;
  description?: string | null;
  priceText?: string | null;
  photoUrl?: string | null;
  menuSection?: string | null;
  popular: boolean;
}
export interface FeaturedProductBody {
  name: string;
  description?: string | null;
  priceText?: string | null;
  photoUrl?: string | null;
}

// ---------------------------------------------------------------------------
// Phase 3 — updates, analytics, profile completeness
// ---------------------------------------------------------------------------
export interface BusinessUpdate {
  id: string;
  businessId: string;
  body: string;
  imageUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessUpdateBody {
  body: string;
  imageUrl?: string | null;
  published?: boolean | null;
}

export type BusinessEventType =
  | "PROFILE_VIEW"
  | "PHONE_CLICK"
  | "WHATSAPP_CLICK"
  | "DIRECTIONS_CLICK"
  | "WEBSITE_CLICK";

export type AnalyticsRange = "7d" | "30d" | "all";

export interface AnalyticsResponse {
  range: AnalyticsRange;
  from: string | null;
  profileViews: number;
  phoneClicks: number;
  whatsappClicks: number;
  directionsClicks: number;
  websiteClicks: number;
}

export interface CompletenessItem {
  key: string;
  label: string;
  /** short call-to-action; null for completed items */
  action: string | null;
}

export interface CompletenessResponse {
  percentage: number;
  completed: CompletenessItem[];
  recommended: CompletenessItem[];
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
  logoUrl?: string | null;
  latitude: number;
  longitude: number;
  priceTier: PriceTier;
  attributeIds: string[];
  // "Business presence" (spec Step 4) — all optional; blank is sent as null / treated as absent.
  websiteUrl?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
}

export type UpdateBusinessRequest = CreateBusinessRequest;

export type SortOption = "relevance" | "rating" | "distance" | "newest" | "most_reviewed";

export interface BusinessSearchParams {
  categoryId?: string;
  areaId?: string;
  priceTier?: PriceTier;
  minRating?: number;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  /** Free-text search-bar query — business name, category/service keyword, or a natural-language phrase. */
  q?: string;
  /** Free-text location field (e.g. "Mirpur", "Dhanmondi, Dhaka") — matched against area/city names, not a dropdown. */
  location?: string;
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

// Home page "Recent Activity" feed — one row per public review, pre-joined
// with just enough business + reviewer context to render a card without a
// second round trip per item (com.bdreview.platform.review.RecentActivityResponse).
export interface RecentActivityItem {
  reviewId: string;
  businessId: string;
  businessName: string | null;
  businessSlug: string | null;
  businessCoverPhotoUrl: string | null;
  businessCategoryName: string | null;
  userId: string;
  userName: string | null;
  rating: number;
  content: string | null;
  photoUrls: string[];
  usefulCount: number;
  funnyCount: number;
  coolCount: number;
  createdAt: string;
}

// Business detail page "Overall rating" bar chart (com.bdreview.platform.review.RatingBreakdownResponse).
export interface RatingBreakdown {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
  total: number;
}

export type ReviewSortOption = "newest" | "highest" | "lowest";

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
// Business claim
// ---------------------------------------------------------------------------
export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";
export type VerificationMethod = "PHONE" | "EMAIL" | "DOCUMENT";

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
  unreadCount: number;
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