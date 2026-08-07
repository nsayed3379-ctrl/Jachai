"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { RoleGate } from "@/components/role-gate";
import { MessageThreadView } from "@/components/message-thread-view";

function ThreadContent() {
  const { threadId } = useParams<{ threadId: string }>();
  return (
    <div className="max-w-2xl">
      <Link href="/me/messages" className="text-xs text-ink-400 hover:underline">
        ← All conversations
      </Link>
      <h1 className="font-display text-xl font-bold text-ink-900 mt-1 mb-4">Conversation</h1>
      <MessageThreadView threadId={threadId} />
    </div>
  );
}

export default function ConsumerMessageThreadPage() {
  return (
    <RoleGate allow={["CONSUMER"]}>
      <ThreadContent />
    </RoleGate>
  );
}
