"use client";

import { useRef, useState } from "react";
import { galleryApi, uploadFileToPresignedUrl } from "@/lib/api";
import { errorMessage, useToast } from "@/lib/toast-context";
import { Button } from "../ui/button";

/**
 * Small optional-photo field for a catalog row (menu item, team member,
 * product). Reuses the existing business-scoped pre-signed upload flow — it
 * just needs a CDN URL, so it stops after the PUT and never touches the
 * gallery (business_photo) table.
 */
export function ModulePhotoInput({
  businessId,
  value,
  onChange,
  label = "Photo",
  shape = "square",
}: {
  businessId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  shape?: "square" | "circle";
}) {
  const { show } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      show("Please choose a JPG, PNG, or WebP image.", "error");
      return;
    }
    setUploading(true);
    try {
      const presigned = await galleryApi.requestUploadUrl(businessId, file.name);
      const ok = await uploadFileToPresignedUrl(presigned.uploadUrl, file);
      if (!ok) throw new Error("Upload failed");
      onChange(presigned.cdnUrlAfterUpload);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="block text-xs font-medium uppercase tracking-wide text-ink-500 mb-1.5">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className={`h-14 w-14 border border-ink-200 object-cover ${shape === "circle" ? "rounded-full" : "rounded-lg"}`}
          />
        ) : (
          <div className={`h-14 w-14 border border-ink-200 bg-ink-100 ${shape === "circle" ? "rounded-full" : "rounded-lg"}`} />
        )}
        <div className="flex flex-col gap-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFile(e.target.files?.[0])}
            disabled={uploading}
            className="text-xs text-ink-500"
          />
          <div className="flex gap-2">
            {uploading && <span className="text-xs text-ink-400">Uploading…</span>}
            {value && !uploading && (
              <Button type="button" size="sm" variant="ghost" className="h-6 px-1 text-xs" onClick={() => onChange(null)}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
