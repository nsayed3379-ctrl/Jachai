"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { cn, focusRing, interactiveTransition } from "@/lib/utils";
import { Sheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/misc";

const sheetItemClass = cn(
  "flex min-h-12 w-full items-center rounded-lg px-3 text-[15px] font-medium text-ink-900 hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-800",
  interactiveTransition,
  focusRing
);
const sheetItemClassDanger = cn(
  "flex min-h-12 w-full items-center rounded-lg px-3 text-[15px] font-medium text-rose-600 hover:bg-rose-500/10",
  interactiveTransition,
  focusRing
);

/**
 * 96px avatar with a camera badge that opens an action sheet (Take photo / Choose from
 * library / Remove) instead of ever showing a native "Choose File" input directly. Shared
 * by the profile photo and the community avatar — the two upload flows differ (one batches
 * into "Done", the other saves on pick) but the picking UI itself is identical.
 */
export function AvatarPicker({
  imageUrl,
  fallback,
  onSelectFile,
  onRemove,
  ariaLabel,
  size = 96,
  uploading = false,
}: {
  imageUrl: string | null;
  fallback: React.ReactNode;
  onSelectFile: (file: File) => void;
  /** Omit to hide the "Remove photo" option entirely (nothing to remove). */
  onRemove?: () => void;
  ariaLabel: string;
  size?: number;
  uploading?: boolean;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onSelectFile(file);
    setSheetOpen(false);
  }

  return (
    <div className="mx-auto flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800">{fallback}</div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-900/40">
            <Spinner className="text-white" />
          </div>
        )}
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={() => setSheetOpen(true)}
          className={cn(
            "absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-crimson-600 text-white shadow-sm hover:bg-crimson-700",
            focusRing
          )}
        >
          <Camera size={16} strokeWidth={1.75} />
        </button>
      </div>

      <input
        ref={libraryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} labelledBy="avatar-picker-heading">
        <h2 id="avatar-picker-heading" className="sr-only">
          Change photo
        </h2>
        <div className="p-2 sm:p-3">
          <button type="button" onClick={() => cameraInputRef.current?.click()} className={cn(sheetItemClass, "sm:hidden")}>
            Take photo
          </button>
          <button type="button" onClick={() => libraryInputRef.current?.click()} className={sheetItemClass}>
            Choose from library
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={() => {
                setSheetOpen(false);
                onRemove();
              }}
              className={sheetItemClassDanger}
            >
              Remove photo
            </button>
          )}
        </div>
      </Sheet>
    </div>
  );
}
