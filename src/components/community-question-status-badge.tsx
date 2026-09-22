import { COMMUNITY_QUESTION_STATUS_META } from "@/lib/community-constants";
import { cn } from "@/lib/utils";
import type { CommunityQuestionStatus } from "@/lib/types";
import { Badge } from "./ui/misc";

/** Small colored-dot status badge for a QUESTION post — shared by the feed card and detail page. */
export function QuestionStatusBadge({ status, className }: { status: CommunityQuestionStatus; className?: string }) {
  const meta = COMMUNITY_QUESTION_STATUS_META[status];
  return (
    <Badge tone={meta.tone} className={cn("font-medium", className)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dotClass)} aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}
