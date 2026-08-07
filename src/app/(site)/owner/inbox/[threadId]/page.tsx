"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { RoleGate } from "@/components/role-gate";
import { MessageThreadView } from "@/components/message-thread-view";

function ThreadContent() {
  const { threadId } = useParams<{ threadId: string }>();
  return (
    <div className="max-w-2xl">
      <Link href="/owner/inbox" className="text-xs text-ink-400 hover:underline">
        ← Inbox
      </Link>
      <h1 className="font-display text-xl font-bold text-ink-900 mt-1 mb-4">Conversation</h1>
      <div className="flex h-[70vh] flex-col rounded-2xl border border-ink-200/70 bg-surface shadow-card overflow-hidden">
        <MessageThreadView threadId={threadId} />
      </div>
    </div>
  );
}

export default function OwnerInboxThreadPage() {
  return (
    <RoleGate allow={["BUSINESS_OWNER"]}>
      <ThreadContent />
    </RoleGate>
  );
}
