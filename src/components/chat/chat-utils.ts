import type { Message } from "@/lib/types";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export interface MessageGroupInfo {
  message: Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

/** Consecutive messages from the same sender within 5 minutes read as one visual group. */
export function groupMessages(messages: Message[]): MessageGroupInfo[] {
  return messages.map((message, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const groupedWithPrev =
      !!prev &&
      prev.senderUserId === message.senderUserId &&
      new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;
    const groupedWithNext =
      !!next &&
      next.senderUserId === message.senderUserId &&
      new Date(next.createdAt).getTime() - new Date(message.createdAt).getTime() < GROUP_WINDOW_MS;
    return { message, isFirstInGroup: !groupedWithPrev, isLastInGroup: !groupedWithNext };
  });
}

/** "Today" / "Yesterday" / "Mon 23 Sep" — for the centered day-separator pill. */
export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** True the first time a message's day differs from the previous message's day (or it's the first message). */
export function isNewDay(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].createdAt);
  const cur = new Date(messages[index].createdAt);
  return prev.toDateString() !== cur.toDateString();
}

export function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}
