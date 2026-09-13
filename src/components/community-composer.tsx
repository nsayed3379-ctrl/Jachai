"use client";

import { useEffect, useRef, useState } from "react";
import { communityApi, uploadFileToPresignedUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { avatarColorClass, avatarInitials, cn } from "@/lib/utils";
import type { CommunityMentionedBusinessSummary, CommunityPostResponse } from "@/lib/types";
import { Button } from "./ui/button";
import { Textarea } from "./ui/field";

/**
 * "Join Community" post composer — text and/or a single image (never video,
 * per spec), plus @mention typeahead for tagging business listings. Image
 * upload reuses the same pre-signed-URL flow as the business gallery
 * (lib/api.ts's uploadFileToPresignedUrl).
 */
export function CommunityComposer({ onPosted }: { onPosted: (post: CommunityPostResponse) => void }) {
  const { user, profile } = useAuth();
  const { openLogin } = useAuthModal();
  const { show } = useToast();

  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState<CommunityMentionedBusinessSummary[]>([]);
  const [mentioned, setMentioned] = useState<CommunityMentionedBusinessSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Debounced @mention search — only fires once the person pauses typing.
  useEffect(() => {
    if (!mentionQuery.trim()) {
      setMentionResults([]);
      return;
    }
    const handle = setTimeout(() => {
      communityApi
        .searchMentions(mentionQuery.trim())
        .then(setMentionResults)
        .catch(() => setMentionResults([]));
    }, 300);
    return () => clearTimeout(handle);
  }, [mentionQuery]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  function handleFileSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
  }

  function addMention(business: CommunityMentionedBusinessSummary) {
    setMentioned((prev) => (prev.some((b) => b.id === business.id) ? prev : [...prev, business]));
    setMentionQuery("");
    setMentionResults([]);
  }

  function removeMention(businessId: string) {
    setMentioned((prev) => prev.filter((b) => b.id !== businessId));
  }

  async function handleSubmit() {
    if (!user) {
      openLogin();
      return;
    }
    if (!content.trim() && !imageFile) {
      show("Write something or add a picture first", "error");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const presigned = await communityApi.requestUploadUrl(imageFile.name);
        const uploaded = await uploadFileToPresignedUrl(presigned.uploadUrl, imageFile);
        if (!uploaded) throw new Error("Image upload failed. Please try again.");
        imageUrl = presigned.cdnUrlAfterUpload;
      }
      const post = await communityApi.create({
        content: content.trim() || null,
        imageUrl,
        mentionedBusinessIds: mentioned.map((b) => b.id),
      });
      onPosted(post);
      setContent("");
      removeImage();
      setMentioned([]);
      show("Posted", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-ink-100 bg-surface p-5 text-center shadow-card">
        <p className="text-sm text-ink-500">Log in to share something with the community.</p>
        <Button className="mt-3" size="sm" onClick={openLogin}>
          Log in
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-surface p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
            avatarColorClass(profile?.name ?? user.id)
          )}
        >
          {avatarInitials(profile?.name)}
        </div>
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with the community…"
            className="min-h-[64px]"
          />

          {imagePreviewUrl && (
            <div className="relative mt-2 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreviewUrl} alt="" className="max-h-64 rounded-lg border border-ink-100 object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/80 text-white hover:bg-ink-900"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          )}

          <div className="relative mt-2">
            <input
              value={mentionQuery}
              onChange={(e) => setMentionQuery(e.target.value)}
              placeholder="Mention a business…"
              className="w-full rounded-lg border border-ink-200 bg-surface px-3.5 py-2 text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-crimson-500/30 focus:border-crimson-500"
            />
            {mentionResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-ink-100 bg-surface shadow-pop">
                {mentionResults.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => addMention(b)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-50"
                  >
                    {b.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <span className="h-5 w-5 rounded-full bg-ink-100" />
                    )}
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {mentioned.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {mentioned.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 rounded-full bg-crimson-50 px-2.5 py-1 text-xs font-medium text-crimson-700"
                >
                  @{b.name}
                  <button type="button" onClick={() => removeMention(b.id)} aria-label={`Remove ${b.name}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
            >
              📷 Photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleFileSelected(e.target.files)}
            />
            <Button size="sm" onClick={handleSubmit} loading={submitting}>
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
