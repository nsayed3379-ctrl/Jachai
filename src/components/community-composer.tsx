"use client";

import { useEffect, useRef, useState } from "react";
import { communityApi, uploadFileToPresignedUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthModal } from "@/lib/auth-modal-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { avatarColorClass, avatarInitials, cn } from "@/lib/utils";
import type { CommunityMentionedBusinessSummary, CommunityPostResponse } from "@/lib/types";
import { Button } from "./ui/button";

const DEFAULT_PLACEHOLDER = "What's happening around you?";

// "Question" and "Recommend" are tone presets, not a stored post type — the
// backend has one post shape (text + optional image); these just nudge the
// placeholder/emoji so the composer reads like the target design. "Poll"
// has no backend support yet, so it's shown but disabled rather than faked.
const TONE_PRESETS = [
  { key: "photo" as const, icon: "📷", label: "Photo" },
  { key: "question" as const, icon: "❓", label: "Question" },
  { key: "recommend" as const, icon: "⭐", label: "Recommend" },
  { key: "poll" as const, icon: "📊", label: "Poll" },
];

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
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionBoxOpen, setMentionBoxOpen] = useState(false);
  const [mentionResults, setMentionResults] = useState<CommunityMentionedBusinessSummary[]>([]);
  const [mentioned, setMentioned] = useState<CommunityMentionedBusinessSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  function handlePresetClick(key: (typeof TONE_PRESETS)[number]["key"]) {
    if (!user) {
      openLogin();
      return;
    }
    if (key === "photo") {
      fileRef.current?.click();
      return;
    }
    if (key === "poll") {
      show("Polls are coming soon", "info");
      return;
    }
    setPlaceholder(key === "question" ? "Ask the community a question…" : "What do you recommend, and why?");
    textareaRef.current?.focus();
  }

  function addMention(business: CommunityMentionedBusinessSummary) {
    setMentioned((prev) => (prev.some((b) => b.id === business.id) ? prev : [...prev, business]));
    setMentionQuery("");
    setMentionResults([]);
    setMentionBoxOpen(true);
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
      setPlaceholder(DEFAULT_PLACEHOLDER);
      removeImage();
      setMentioned([]);
      setMentionBoxOpen(false);
      show("Posted", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-surface p-5 text-center shadow-card">
        <p className="text-sm text-ink-500">Log in to share something with the community.</p>
        <Button className="mt-3" size="sm" onClick={openLogin}>
          Log in
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-surface p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
            avatarColorClass(profile?.name ?? user.id)
          )}
        >
          {avatarInitials(profile?.name)}
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={content ? 3 : 1}
          className="w-full resize-none rounded-2xl border-0 bg-ink-50 px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-crimson-500/30"
        />
      </div>

      {imagePreviewUrl && (
        <div className="relative ml-[52px] mt-3 inline-block">
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

      {(mentionBoxOpen || mentioned.length > 0) && (
        <div className="ml-[52px] mt-3">
          <div className="relative">
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
        </div>
      )}

      <div className="my-3 h-px bg-ink-100" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {TONE_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePresetClick(preset.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50",
                preset.key === "poll" && "opacity-50"
              )}
              title={preset.key === "poll" ? "Coming soon" : undefined}
            >
              <span>{preset.icon}</span>
              <span className="hidden sm:inline">{preset.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMentionBoxOpen(true)}
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50 sm:inline-flex"
            title="Mention a business"
          >
            <span>📍</span>
            <span>Mention</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files)}
          />
        </div>
        <Button size="sm" onClick={handleSubmit} loading={submitting}>
          Post
        </Button>
      </div>
    </div>
  );
}
