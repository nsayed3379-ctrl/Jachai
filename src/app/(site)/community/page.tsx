"use client";

import { useCallback, useEffect, useState } from "react";
import { communityApi } from "@/lib/api";
import { errorMessage } from "@/lib/toast-context";
import type { CommunityPostResponse } from "@/lib/types";
import { CommunityComposer } from "@/components/community-composer";
import { CommunityPostCard } from "@/components/community-post-card";
import { EmptyState, ErrorBanner, PageSpinner } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPostResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      <div className="mt-5">
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
            <CommunityPostCard key={post.id} post={post} onChanged={handleChanged} onDeleted={handleDeleted} />
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
