"use client";

import { useRef, useState } from "react";
import { galleryApi, reviewApi, uploadFileToPresignedUrl } from "@/lib/api";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { ReviewResponse } from "@/lib/types";
import { StarInput } from "./star-rating";
import { Button } from "./ui/button";
import { Textarea } from "./ui/field";

const MAX_PHOTO_MB = 5;
const MAX_PHOTOS = 6;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  const [rating, setRating] = useState(editing?.rating ?? 5);
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
          show(`You can attach up to ${MAX_PHOTOS} photos.`, "error");
          break;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          show(`${file.name || "That photo"}: only JPG, PNG, or WEBP photos are allowed.`, "error");
          continue;
        }
        if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
          show(`${file.name || "Photo"}: must be under ${MAX_PHOTO_MB}MB.`, "error");
          continue;
        }
        // Note: the backend exposes photo upload only under
        // /businesses/{id}/photos (spec §13 gallery); there is no dedicated
        // review-photo upload endpoint yet, so we reuse the business's
        // pre-signed-URL flow here as the closest available equivalent.
        const presigned = await galleryApi.requestUploadUrl(businessId, file.name || "review-photo.jpg");
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
    setSubmitting(true);
    try {
      if (editing) {
        await reviewApi.edit(editing.id, { rating, content });
        show("Review updated", "success");
      } else {
        await reviewApi.submit({ businessId, rating, content, photoUrls });
        show("Review submitted", "success");
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
        {editing ? "Edit your review" : "Write a review"}
      </p>
      <StarInput value={rating} onChange={setRating} />
      <Textarea
        className="mt-3"
        placeholder="Share details of your experience — what went well, what didn't."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={4000}
      />

      {!editing && (
        <div className="mt-3">
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

          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <span>Add photos</span>
            {photoUrls.length < MAX_PHOTOS && (
              <>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2 py-1 font-medium text-ink-600 transition-colors hover:border-crimson-400 hover:text-crimson-600 disabled:opacity-50"
                >
                  <CameraIcon />
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2 py-1 font-medium text-ink-600 transition-colors hover:border-crimson-400 hover:text-crimson-600 disabled:opacity-50"
                >
                  <GalleryIcon />
                  Gallery
                </button>
              </>
            )}
            {uploading && <span className="text-ink-400">Uploading…</span>}
          </div>

          {photoUrls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {photoUrls.map((url, i) => (
                <div key={i} className="relative h-14 w-14 overflow-hidden rounded-md border border-ink-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label="Remove photo"
                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold leading-none text-white hover:bg-black/80"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={submit} loading={submitting || uploading}>
          {editing ? "Save changes" : "Submit review"}
        </Button>
      </div>
    </div>
  );
}
