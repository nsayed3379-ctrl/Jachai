"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { messageApi } from "@/lib/api";
import { MessageThreadView } from "@/components/message-thread-view";
import { PageSpinner } from "@/components/ui/misc";

export default function OwnerMessageThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const [title, setTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    messageApi
      .businessInbox()
      .then((threads) => {
        const t = threads.find((th) => th.id === threadId);
        if (t) {
          setTitle(t.consumerName || `Customer ${t.consumerUserId.slice(0, 8)}…`);
        }
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

  return <MessageThreadView threadId={threadId} title={title ?? "Conversation"} />;
}