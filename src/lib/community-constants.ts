import { BarChart3, HelpCircle, MessageSquare, Star, type LucideIcon } from "lucide-react";
import type { CommunityFeedTab, CommunityPostType, CommunityQuestionStatus, CommunitySortOrder, CommunityTopic } from "./types";

// Full label map for every backend CommunityTopic value (com.bdreview.platform
// .community.CommunityTopic) — kept independent of the selectable list below
// so a post tagged with a since-hidden topic (SERVICES/JOBS/EDUCATION/TRAVEL —
// still valid on the backend, just not offered in the composer anymore) still
// renders a correct badge label instead of "undefined".
export const COMMUNITY_TOPIC_LABELS: Record<CommunityTopic, string> = {
  FOOD: "Food",
  HEALTHCARE: "Healthcare",
  BEAUTY: "Beauty",
  SHOPPING: "Shopping",
  FITNESS: "Fitness",
  LOCAL: "Local",
  SERVICES: "Services",
  JOBS: "Jobs",
  EDUCATION: "Education",
  TRAVEL: "Travel",
  GENERAL: "General",
};

// Selectable in the composer's topic dropdown — SERVICES/JOBS/EDUCATION/TRAVEL
// are intentionally left out (not shown in the feed's filter pill row either).
export const COMMUNITY_TOPICS: { value: CommunityTopic; label: string }[] = [
  { value: "FOOD", label: "Food" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "BEAUTY", label: "Beauty" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "FITNESS", label: "Fitness" },
  { value: "LOCAL", label: "Local" },
  { value: "GENERAL", label: "General" },
];

// Feed topic-filter pill row: the 5 most-used topics (mirrors the 6 business
// categories minus GENERAL, the catch-all default) so the row fits on one
// line without horizontal scrolling.
export const COMMUNITY_FEED_TOPIC_FILTERS = COMMUNITY_TOPICS.slice(0, 5);

// "Review" is a UI-only label for the RECOMMENDATION post type — it stays a plain community
// opinion/experience post, fully separate from the platform's real star-rating Business Review
// system (com.bdreview.platform.review). No schema change, just less confusing wording.
export const COMMUNITY_POST_TYPES: { value: CommunityPostType; label: string; icon: LucideIcon }[] = [
  { value: "DISCUSSION", label: "Discussion", icon: MessageSquare },
  { value: "QUESTION", label: "Question", icon: HelpCircle },
  { value: "RECOMMENDATION", label: "Review", icon: Star },
  { value: "POLL", label: "Poll", icon: BarChart3 },
];

export const COMMUNITY_POST_TYPE_META: Record<CommunityPostType, { label: string; icon: LucideIcon }> =
  Object.fromEntries(COMMUNITY_POST_TYPES.map((t) => [t.value, { label: t.label, icon: t.icon }])) as Record<
    CommunityPostType,
    { label: string; icon: LucideIcon }
  >;

// The composer's "What do you want to post?" 3-way type picker — Poll is deliberately excluded
// here (it's its own separate "Add poll" toggle, mutually exclusive with this picker — see
// CommunityComposer).
export const COMMUNITY_COMPOSER_TYPES: { value: "DISCUSSION" | "QUESTION" | "RECOMMENDATION"; label: string }[] = [
  { value: "RECOMMENDATION", label: "Review" },
  { value: "QUESTION", label: "Question" },
  { value: "DISCUSSION", label: "Discussion" },
];

// Primary feed nav — All/Questions/Reviews/Discussions (Poll has no dedicated tab; a poll still
// shows up under "All"). `null` means no postType filter.
export const COMMUNITY_FEED_TYPE_FILTERS: { value: CommunityPostType | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "QUESTION", label: "Questions" },
  { value: "RECOMMENDATION", label: "Reviews" },
  { value: "DISCUSSION", label: "Discussions" },
];

// The only 3 durations a poll can run for — mirrors CommunityPostService's
// ALLOWED_POLL_DURATION_HOURS exactly (hours, so it maps straight onto the request body).
export const COMMUNITY_POLL_MIN_OPTIONS = 2;
export const COMMUNITY_POLL_MAX_OPTIONS = 6;
export const COMMUNITY_POLL_DURATIONS: { value: number; label: string }[] = [
  { value: 24, label: "1 day" },
  { value: 72, label: "3 days" },
  { value: 168, label: "7 days" },
];

export const COMMUNITY_FEED_TABS: { value: CommunityFeedTab; label: string }[] = [
  { value: "FOR_YOU", label: "For You" },
  { value: "FOLLOWING", label: "Following" },
  { value: "NEARBY", label: "Nearby" },
];

export const COMMUNITY_SORT_OPTIONS: { value: CommunitySortOrder; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "TOP", label: "Top" },
];

// Status dot + Badge tone for a QUESTION post — no emoji (🟡/🟢/⚪ in the original mock became a
// small colored dot, matching the icon-quality pass done elsewhere in Community).
export const COMMUNITY_QUESTION_STATUS_META: Record<CommunityQuestionStatus, { label: string; tone: "gold" | "brand" | "neutral"; dotClass: string }> = {
  OPEN: { label: "Open", tone: "gold", dotClass: "bg-gold-500" },
  RESOLVED: { label: "Resolved", tone: "brand", dotClass: "bg-brand-500" },
  CLOSED: { label: "Closed", tone: "neutral", dotClass: "bg-ink-400" },
};
