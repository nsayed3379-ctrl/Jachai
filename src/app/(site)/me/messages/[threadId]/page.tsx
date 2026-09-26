"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { messageApi } from "@/lib/api";
import { lookupBusiness } from "@/lib/business-cache";
import type { CachedBusinessSummary } from "@/lib/types";
import { ChatPane } from "@/components/chat/ChatPane";
import { PageSpinner } from "@/components/ui/misc";

export default function ConsumerMessageThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [business, setBusiness] = useState<CachedBusinessSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    messageApi
      .myThreads()
      .then((threads) => {
        const t = threads.find((th) => th.id === threadId);
        if (t) setBusiness(lookupBusiness(t.businessId));
      })
      .finally(() => setLoading(false));
  }, [threadId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  const name = business?.name ?? "Conversation";

  return (
    <ChatPane
      threadId={threadId}
      businessId={business?.id}
      currentUserId={user?.id}
      otherPartyName={name}
      otherPartyAvatarUrl={business?.coverPhotoUrl}
      onBack={() => router.push("/me/messages")}
      onViewBusiness={business ? () => router.push(`/business/${business.slug}`) : undefined}
      showQuickReplies
    />
  );
}
