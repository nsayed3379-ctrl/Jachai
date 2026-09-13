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
  /** Optional — powers slot generation for booking (minutes). */
  durationMinutes: number | null;
  /** Optional cleanup/travel time appended after the service (minutes). */
  bufferMinutes: number | null;
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
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Staff scheduling (booking — Salon & Beauty)
// ---------------------------------------------------------------------------
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

/** "HH:mm" or "HH:mm:ss" (LocalTime). */
export interface WeeklyScheduleEntry {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface TimeOff {
  id: string;
  teamMemberId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
}

export interface TimeOffBody {
  startDate: string;
  endDate: string;
  reason?: string | null;
}

/** A service a staff member provides, with an optional per-staff duration/buffer override (null = use the service's own default). */
export interface StaffServiceAssignment {
  serviceId: string;
  durationMinutes: number | null;
  bufferMinutes: number | null;
}

export interface StaffScheduleResponse {
  assignments: StaffServiceAssignment[];
  weeklySchedule: WeeklyScheduleEntry[];
  timeOff: TimeOff[];
}

export interface QueueStatus {
  applicable: boolean;
  position: number | null;
  estimatedWaitMinutes: number | null;
  currentlyServingService: string | null;
}

export interface AvailabilitySlot {
  /** "HH:mm:ss" (LocalTime). */
  time: string;
  available: boolean;
}

export interface AvailabilityResponse {
  date: string;
  durationMinutes: number;
  bufferMinutes: number;
  slots: AvailabilitySlot[];
}

export interface MenuItem {
  id: string;
  businessId: string;
  menuSection: string | null;
  name: string;
  description: string | null;
  priceText: string | null;
  /** Commerce (Phase A): numeric price — required for the item to be orderable. */
  price: number | null;
  available: boolean;
  orderingEnabled: boolean;
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
  durationMinutes?: number | null;
  bufferMinutes?: number | null;
}
export interface TeamMemberBody {
  name: string;
  role?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  active?: boolean;
}
export interface MenuItemBody {
  name: string;
  description?: string | null;
  priceText?: string | null;
  photoUrl?: string | null;
  menuSection?: string | null;
  popular: boolean;
  /** Commerce (Phase A): numeric price + availability / ordering toggles. */
  price?: number | null;
  available?: boolean | null;
  orderingEnabled?: boolean | null;
}
export interface FeaturedProductBody {
  name: string;
  description?: string | null;
  priceText?: string | null;
  photoUrl?: string | null;
}

// ---------------------------------------------------------------------------
// Commerce & Fulfillment — Phase A: restaurant direct ordering
// ---------------------------------------------------------------------------
export type CommerceMode = "SHOWCASE_ONLY" | "DIRECT_ORDER" | "BOOKING" | "SERVICE_REQUEST";
export type FulfillmentType = "PICKUP" | "OWN_DELIVERY";
export type PaymentMethod = "CASH_ON_DELIVERY" | "PAY_AT_BUSINESS";
export type PaymentStatus = "UNPAID" | "PAID";
export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "PICKED_UP"
  | "DELIVERED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";
export type OrderItemSource = "MENU_ITEM" | "PRODUCT";

/** Public-safe subset of a business's commerce config (GET /commerce). */
export interface PublicCommerceView {
  mode: CommerceMode;
  orderingEnabled: boolean;
  pickupEnabled: boolean;
  ownDeliveryEnabled: boolean;
  bookingEnabled: boolean;
  acceptingOrders: boolean;
  pauseReason: string | null;
  paymentCashOnDelivery: boolean;
  paymentPayAtBusiness: boolean;
  hasDeliveryZones: boolean;
}

/** Full owner-facing commerce settings (GET /commerce/manage, PUT /commerce). */
export interface CommerceSettings {
  businessId: string;
  mode: CommerceMode;
  orderingEnabled: boolean;
  pickupEnabled: boolean;
  ownDeliveryEnabled: boolean;
  bookingEnabled: boolean;
  autoConfirmBookings: boolean;
  acceptingOrders: boolean;
  pauseReason: string | null;
  defaultPrepMinutes: number | null;
  paymentCashOnDelivery: boolean;
  paymentPayAtBusiness: boolean;
  hasDeliveryZones: boolean;
}

export interface CommerceSettingsBody {
  mode: CommerceMode;
  orderingEnabled: boolean;
  pickupEnabled: boolean;
  ownDeliveryEnabled: boolean;
  paymentCashOnDelivery: boolean;
  paymentPayAtBusiness: boolean;
  defaultPrepMinutes?: number | null;
}

export interface BookingSettingsBody {
  bookingEnabled: boolean;
  autoConfirmBookings: boolean;
}

export interface DeliveryZone {
  id: string;
  businessId: string;
  name: string;
  minDistanceKm: number;
  maxDistanceKm: number;
  deliveryFee: number;
  minimumOrderAmount: number;
  estimatedDeliveryMinutes: number | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface DeliveryZoneBody {
  name: string;
  minDistanceKm: number;
  maxDistanceKm: number;
  deliveryFee: number;
  minimumOrderAmount?: number | null;
  estimatedDeliveryMinutes?: number | null;
  active?: boolean | null;
}

export interface DeliveryQuote {
  deliverable: boolean;
  distanceKm: number;
  zoneId: string | null;
  zoneName: string | null;
  deliveryFee: number | null;
  minimumOrderAmount: number | null;
  estimatedDeliveryMinutes: number | null;
  maxDeliveryKm: number | null;
}

/** One line of the client-side cart (localStorage). */
export interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  businessId: string;
  businessName: string;
  businessSlug: string;
  lines: CartLine[];
}

export interface PlaceOrderBody {
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  customerNote?: string | null;
  items: { menuItemId: string; quantity: number }[];
}

export interface OrderItem {
  id: string;
  sourceType: OrderItemSource;
  sourceItemId: string | null;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderStatusEvent {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  at: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  customerUserId: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  deliveryDistanceKm: number | null;
  customerNote: string | null;
  rejectionReason: string | null;
  createdAt: string;
  items: OrderItem[];
  timeline: OrderStatusEvent[] | null;
}

// ---------------------------------------------------------------------------
// Commerce & Fulfillment — Phase C: appointment booking (Salon & Beauty)
// ---------------------------------------------------------------------------
export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED" | "NO_SHOW";

export interface PlaceBookingBody {
  serviceId: string;
  staffId?: string | null;
  /** "YYYY-MM-DD" */
  preferredDate: string;
  /** "HH:mm" (24h) */
  preferredTime: string;
  customerName: string;
  customerPhone: string;
  customerNote?: string | null;
}

export interface BookingStatusEvent {
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  note: string | null;
  at: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  customerUserId: string;
  status: BookingStatus;
  serviceId: string | null;
  serviceName: string;
  staffId: string | null;
  staffName: string | null;
  preferredDate: string;
  preferredTime: string;
  customerName: string;
  customerPhone: string;
  customerNote: string | null;
  rejectionReason: string | null;
  createdAt: string;
  timeline: BookingStatusEvent[] | null;
  autoConfirmed: boolean;
  startedAt: string | null;
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

// ---------------------------------------------------------------------------
// "Join Community" — Facebook-style feed (spec: navbar entry point, text +
// single image post, reactions, comments, business mentions). Mirrors
// com.bdreview.platform.community's response DTOs.
// ---------------------------------------------------------------------------
export type CommunityPostReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";

export interface CommunityAuthorSummary {
  id: string;
  name: string | null;
  profilePhotoUrl: string | null;
}

export interface CommunityMentionedBusinessSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  verified: boolean;
}

export interface CommunityPostResponse {
  id: string;
  author: CommunityAuthorSummary;
  content: string | null;
  imageUrl: string | null;
  likeCount: number;
  loveCount: number;
  hahaCount: number;
  wowCount: number;
  sadCount: number;
  angryCount: number;
  totalReactionCount: number;
  myReaction: CommunityPostReactionType | null;
  commentCount: number;
  mentionedBusinesses: CommunityMentionedBusinessSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityCommentResponse {
  id: string;
  author: CommunityAuthorSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommunityPostBody {
  content: string | null;
  imageUrl: string | null;
  mentionedBusinessIds: string[];
}

export interface UpdateCommunityPostBody {
  content: string | null;
  mentionedBusinessIds: string[];
}