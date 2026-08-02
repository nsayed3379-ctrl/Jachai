"use client";

import { useRef, useState } from "react";
import { galleryApi, reviewApi, uploadFileToPresignedUrl } from "@/lib/api";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { ReviewResponse } from "@/lib/types";
import { StarInput } from "./star-rating";
import { Button } from "./ui/button";
import { Textarea } from "./ui/field";

const MAX_PHOTO_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          show(`${file.name}: only JPG, PNG, or WEBP photos are allowed.`, "error");
          continue;
        }
        if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
          show(`${file.name}: must be under ${MAX_PHOTO_MB}MB.`, "error");
          continue;
        }
        // Note: the backend exposes photo upload only under
        // /businesses/{id}/photos (spec §13 gallery); there is no dedicated
        // review-photo upload endpoint yet, so we reuse the business's
        // pre-signed-URL flow here as the closest available equivalent.
        const presigned = await galleryApi.requestUploadUrl(businessId, file.name);
        await uploadFileToPresignedUrl(presigned.uploadUrl, file);
        setPhotoUrls((prev) => [...prev, presigned.cdnUrlAfterUpload]);
      }
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="text-xs text-ink-500"
          />
          {photoUrls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {photoUrls.map((url, i) => (
                <span key={i} className="text-xs bg-white border border-ink-200 rounded px-2 py-1 truncate max-w-[10rem]">
                  {url.split("/").pop()}
                </span>
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
