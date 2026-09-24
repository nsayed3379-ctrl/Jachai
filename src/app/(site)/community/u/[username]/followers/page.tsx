"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage } from "@/lib/toast-context";
import type { CommunityFollowListItem } from "@/lib/types";
import { CommunityFollowList } from "@/components/community-follow-list";
import { EmptyState, ErrorBanner, PageSpinner } from "@/components/ui/misc";

export default function CommunityFollowersPage() {
  const { username } = useParams<{ username: string }>();
  const { user, profile } = useAuth();
  const [ownerCommunityProfileId, setOwnerCommunityProfileId] = useState<string | null>(null);
  const [items, setItems] = useState<CommunityFollowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    communityApi
      .getProfile(username)
      .then((viewedProfile) => {
        setOwnerCommunityProfileId(viewedProfile.communityProfileId);
        return communityApi.followers(viewedProfile.communityProfileId, 0, 50);
      })
      .then((res) => setItems(res.content))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(load, [load]);

  function handleToggled(userId: string, isFollowing: boolean) {
    setItems((prev) => prev.map((item) => (item.author.id === userId ? { ...item, isFollowing } : item)));
  }

  const isOwnList = Boolean(user && ownerCommunityProfileId && profile?.communityProfileId === ownerCommunityProfileId);

  return (
    <div className="py-6">
      <Link href={`/community/u/${username}`} className="text-sm font-medium text-ink-500 hover:text-ink-800">
        ← Back to profile
      </Link>
      <h1 className="mt-3 font-display text-xl font-bold text-ink-900">{isOwnList ? "Followers" : `People following u/${username}`}</h1>

      <div className="mt-4">
        {loading && <PageSpinner />}
        {!loading && error && <ErrorBanner message={error} />}
        {!loading && !error && items.length === 0 && <EmptyState title="No followers yet." />}
        {!loading && !error && items.length > 0 && <CommunityFollowList items={items} onToggled={handleToggled} />}
      </div>
    </div>
  );
}
