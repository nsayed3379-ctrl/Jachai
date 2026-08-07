

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { messageApi } from "@/lib/api";
import { lookupBusiness } from "@/lib/business-cache";
import { errorMessage } from "@/lib/toast-context";
import { MessageThreadView } from "@/components/message-thread-view";
import { PageSpinner } from "@/components/ui/misc";

export default function ConsumerMessageThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const [title, setTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    messageApi
      .myThreads()
      .then((threads) => {
        const t = threads.find((th) => th.id === threadId);
        if (t) {
          const cached = lookupBusiness(t.businessId);
          setTitle(cached?.name ?? `Business ${t.businessId.slice(0, 8)}…`);
        }
      })
      .catch((err) => errorMessage(err))
      .finally(() => setLoading(false));
  }, [threadId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  return <MessageThreadView threadId={threadId} title={title ?? "Conversation"} />;
}
