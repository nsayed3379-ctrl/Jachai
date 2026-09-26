"use client";

import { useOwnerBusiness } from "@/lib/owner-business-context";
import { BusinessAutoReplyManager } from "@/components/business-auto-reply-manager";

export default function OwnerQuickRepliesPage() {
  const { business } = useOwnerBusiness();

  return (
    <div>
      <h2 className="mb-1 font-display text-lg font-semibold text-ink-900">Quick replies</h2>
      <p className="mb-4 text-sm text-ink-500">
        Tappable question shortcuts in your chat widget — tapping one auto-posts the answer below
        immediately, before you ever see the message. A starter set is already here; edit, delete,
        or add your own.
      </p>
      <BusinessAutoReplyManager businessId={business.id} />
    </div>
  );
}
