"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage } from "@/lib/toast-context";
import type { CommunityFollowListItem } from "@/lib/types";
import { CommunityFollowList } from "@/components/community-follow-list";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorBanner, PageSpinner } from "@/components/ui/misc";

export default function CommunityFollowingPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [items, setItems] = useState<CommunityFollowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    communityApi
      .getProfile(username)
      .then((profile) => {
        setOwnerUserId(profile.userId);
        return communityApi.following(profile.userId, 0, 50);
      })
      .then((res) => setItems(res.content))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(load, [load]);

  function handleToggled(userId: string, isFollowing: boolean) {
    setItems((prev) => prev.map((item) => (item.author.id === userId ? { ...item, isFollowing } : item)));
  }

  const isOwnList = Boolean(user && ownerUserId && user.id === ownerUserId);

  return (
    <div className="py-6">
      <Link href={`/community/u/${username}`} className="text-sm font-medium text-ink-500 hover:text-ink-800">
        ← Back to profile
      </Link>
      <h1 className="mt-3 font-display text-xl font-bold text-ink-900">{isOwnList ? "Following" : `u/${username} is following`}</h1>

      <div className="mt-4">
        {loading && <PageSpinner />}
        {!loading && error && <ErrorBanner message={error} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={isOwnList ? "You're not following anyone yet." : `u/${username} isn't following anyone yet.`}
            action={
              <Link href="/community/explore">
                <Button size="sm" variant="outline">
                  Explore People
                </Button>
              </Link>
            }
          />
        )}
        {!loading && !error && items.length > 0 && <CommunityFollowList items={items} onToggled={handleToggled} />}
      </div>
    </div>
  );
}
