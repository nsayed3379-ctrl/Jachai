"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { messageApi } from "@/lib/api";
import { lookupBusiness } from "@/lib/business-cache";
import type { MessageThread } from "@/lib/types";
import { ChatPane } from "@/components/chat/ChatPane";
import { PageSpinner } from "@/components/ui/misc";

export default function OwnerMessageThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    messageApi
      .businessInbox()
      .then((threads) => setThread(threads.find((th) => th.id === threadId) ?? null))
      .finally(() => setLoading(false));
  }, [threadId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  const name = thread?.consumerName || (thread ? `Customer ${thread.consumerUserId.slice(0, 8)}…` : "Conversation");
  const cachedBusiness = thread ? lookupBusiness(thread.businessId) : null;

  return (
    <ChatPane
      threadId={threadId}
      currentUserId={user?.id}
      otherPartyName={name}
      headerSubtitle={cachedBusiness ? `Re: ${cachedBusiness.name}` : undefined}
      onBack={() => router.push("/owner/inbox")}
      onViewBusiness={cachedBusiness ? () => router.push(`/business/${cachedBusiness.slug}`) : undefined}
    />
  );
}
