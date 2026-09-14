"use client";

import { useCallback, useEffect, useState } from "react";
import { communityApi } from "@/lib/api";
import { errorMessage, useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import type { CommunityPostResponse } from "@/lib/types";
import { CommunityComposer } from "@/components/community-composer";
import { CommunityPostCard } from "@/components/community-post-card";
import { EmptyState, ErrorBanner, PageSpinner } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

// "Following" and "Nearby" need a follow graph / geo-tagged feed the backend
// doesn't have yet — shown for the target layout but intentionally inert
// (a toast, not fake data) rather than pretending they work.
const FEED_TABS = [
  { key: "forYou" as const, label: "For You" },
  { key: "following" as const, label: "Following" },
  { key: "nearby" as const, label: "Nearby" },
];

// Category isn't part of the post model yet, so only "All" is real; the
// rest are shown to match the target design but are disabled with a note.
const CATEGORY_PILLS = ["All", "Food", "Healthcare", "Beauty", "Shopping", "Fitness"];

export default function CommunityPage() {
  const { show } = useToast();
  const [posts, setPosts] = useState<CommunityPostResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof FEED_TABS)[number]["key"]>("forYou");

  const loadFirstPage = useCallback(() => {
    setLoading(true);
    setError(null);
    communityApi
      .feed(0, 10)
      .then((res) => {
        setPosts(res.content);
        setPage(res.page);
        setTotalPages(res.totalPages);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadFirstPage, [loadFirstPage]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await communityApi.feed(page + 1, 10);
      setPosts((prev) => [...prev, ...res.content]);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }

  function handleTabClick(key: (typeof FEED_TABS)[number]["key"]) {
    if (key !== "forYou") {
      show("Coming soon", "info");
      return;
    }
    setActiveTab(key);
  }

  function handleCategoryClick(label: string) {
    if (label !== "All") {
      show("Coming soon", "info");
      return;
    }
  }

  function handlePosted(post: CommunityPostResponse) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleChanged(updated: CommunityPostResponse) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handleDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-ink-900">Join Community</h1>
      <p className="mt-1 text-sm text-ink-500">
        Share updates, ask for recommendations, and tag the businesses you love.
      </p>

      <div className="mt-4 flex gap-1 rounded-full bg-ink-50 p-1">
        {FEED_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabClick(tab.key)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
              activeTab === tab.key ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_PILLS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => handleCategoryClick(label)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              label === "All"
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-ink-200 text-ink-500 hover:border-ink-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <CommunityComposer onPosted={handlePosted} />
      </div>

      <div className="mt-6 space-y-4">
        {loading && <PageSpinner />}
        {!loading && error && <ErrorBanner message={error} />}
        {!loading && !error && posts.length === 0 && (
          <EmptyState
            title="No posts yet"
            description="Be the first to share something with the community."
          />
        )}
        {!loading &&
          !error &&
          posts.map((post) => (
            <div key={post.id} id={`post-${post.id}`}>
              <CommunityPostCard post={post} onChanged={handleChanged} onDeleted={handleDeleted} />
            </div>
          ))}

        {!loading && !error && page + 1 < totalPages && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" size="sm" onClick={loadMore} loading={loadingMore}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
