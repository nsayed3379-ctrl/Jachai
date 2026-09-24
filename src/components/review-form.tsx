"use client";

import { useRef, useState } from "react";
import { reviewApi, uploadFileToPresignedUrl } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { ReviewResponse } from "@/lib/types";
import { StarInput } from "./star-rating";
import { Button } from "./ui/button";
import { Textarea } from "./ui/field";

const MAX_PHOTO_MB = 5;
const MAX_PHOTOS = 6;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Mirrors SubmitReviewRequest/UpdateReviewRequest's @Size(min = 10) on the backend. */
const MIN_CONTENT_LENGTH = 10;

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M4 8h3l1.5-2h7L18 8h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-4.5-4.5a2 2 0 0 0-2.8 0L5 20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ReviewForm({
  businessId,
  editing,
  onDone,
  onCancel,
}: {
  businessId: string;
  editing?: ReviewResponse | null;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const { show } = useToast();
  const { t } = useLanguage();
  // 0 = no star picked yet — was defaulting to 5, which let a single stray
  // "Submit" click (no text, no deliberate star pick) post a full 5★ review
  // and move the business's public rating. See MIN_CONTENT_LENGTH below.
  const [rating, setRating] = useState(editing?.rating ?? 0);
  const [content, setContent] = useState(editing?.content ?? "");
  const [photoUrls, setPhotoUrls] = useState<string[]>(editing?.photoUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let count = photoUrls.length;
    try {
      for (const file of Array.from(files)) {
        if (count >= MAX_PHOTOS) {
          show(t("review_form.error.max_photos", { max: MAX_PHOTOS }), "error");
          break;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          show(t("review_form.error.invalid_type", { name: file.name || t("review_form.that_photo") }), "error");
          continue;
        }
        if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
          show(t("review_form.error.too_large", { name: file.name || t("review_form.photo"), max: MAX_PHOTO_MB }), "error");
          continue;
        }
        const presigned = await reviewApi.requestUploadUrl(file.name || "review-photo.jpg");
        await uploadFileToPresignedUrl(presigned.uploadUrl, file);
        setPhotoUrls((prev) => [...prev, presigned.cdnUrlAfterUpload]);
        count++;
      }
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setUploading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function removePhoto(idx: number) {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    if (rating < 1) {
      show(t("review_form.error.rating_required"), "error");
      return;
    }
    if (content.trim().length < MIN_CONTENT_LENGTH) {
      show(t("review_form.error.content_too_short", { min: MIN_CONTENT_LENGTH }), "error");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await reviewApi.edit(editing.id, { rating, content });
        show(t("review_form.toast.updated"), "success");
      } else {
        await reviewApi.submit({ businessId, rating, content, photoUrls });
        show(t("review_form.toast.submitted"), "success");
      }
      onDone();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-md border border-ink-100 bg-sand-100/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500 mb-2">
        {editing ? t("review_form.heading_edit") : t("review_form.heading_write")}
      </p>
      <StarInput value={rating} onChange={setRating} />
      <Textarea
        className="mt-3"
        placeholder={t("review_form.content_placeholder")}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={4000}
      />

      {!editing && (
        <div className="mt-3 rounded-xl border border-ink-100 bg-surface p-3">
          {/* Camera capture opens the device camera directly on phones;
              the gallery input opens the photo library / file picker. */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink-600">{t("review_form.add_photos")}</span>
            {photoUrls.length < MAX_PHOTOS && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-1.5"
                >
                  <CameraIcon />
                  {t("review_form.camera")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-1.5"
                >
                  <GalleryIcon />
                  {t("review_form.gallery")}
                </Button>
              </>
            )}
            {uploading && <span className="text-xs text-ink-400">{t("common.uploading")}</span>}
          </div>

          {photoUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {photoUrls.map((url, i) => (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-ink-200 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label={t("review_form.remove_photo")}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs font-bold leading-none text-white transition-colors hover:bg-black/80"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
        {onCancel && (
          <Button variant="outline" size="md" onClick={onCancel} className="w-full sm:w-auto">
            {t("common.cancel")}
          </Button>
        )}
        <Button size="md" onClick={submit} loading={submitting || uploading} className="w-full sm:w-auto">
          {editing ? t("review_form.save_changes") : t("review_form.submit_review")}
        </Button>
      </div>
    </div>
  );
}
