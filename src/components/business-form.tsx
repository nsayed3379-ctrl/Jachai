"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  businessApi,
  galleryApi,
  referenceApi,
  uploadFileToPresignedUrl,
} from "@/lib/api";
import { PRICE_TIER_LABELS } from "@/lib/config";
import { errorMessage, useToast } from "@/lib/toast-context";
import type {
  Area,
  BusinessAttribute,
  BusinessResponse,
  Category,
  City,
  CreateBusinessRequest,
  PriceTier,
} from "@/lib/types";
import { Button } from "./ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "./ui/field";
import { ErrorBanner, Spinner } from "./ui/misc";

interface Props {
  existing?: BusinessResponse;
}

const emptyForm: CreateBusinessRequest = {
  name: "",
  categoryId: "",
  cityId: "",
  areaId: "",
  contactNumber: "",
  operatingHours: "",
  description: "",
  coverPhotoUrl: "",
  latitude: 23.780636,
  longitude: 90.419559,
  priceTier: "MODERATE",
  attributeIds: [],
};

function SectionHeader({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-crimson-600 to-crimson-500 text-xs font-semibold text-white shadow-sm">
        {step}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        <p className="text-xs text-ink-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white shadow-sm p-5 md:p-6 h-full">
      {children}
    </div>
  );
}

export function BusinessForm({ existing }: Props) {
  const router = useRouter();
  const { show } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [attributes, setAttributes] = useState<BusinessAttribute[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);

  const [form, setForm] =
    useState<CreateBusinessRequest>(emptyForm);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  /*
   * New business flow:
   *
   * A business ID does not exist before creation.
   * So the selected cover file is kept locally first.
   * After the business is created, the file is uploaded
   * using the newly created business ID.
   */
  const [pendingCoverFile, setPendingCoverFile] =
    useState<File | null>(null);

  const [pendingCoverPreview, setPendingCoverPreview] =
    useState<string | null>(null);

  /*
   * Load reference data
   */
  useEffect(() => {
    Promise.all([
      referenceApi.categories(),
      referenceApi.cities(),
      referenceApi.attributes(),
    ])
      .then(([cats, cityList, attrs]) => {
        setCategories(cats);
        setCities(cityList);
        setAttributes(attrs);
      })
      .catch((err) => {
        show(errorMessage(err), "error");
      })
      .finally(() => {
        setLoadingRef(false);
      });
  }, [show]);

  /*
   * Load existing business data
   */
  useEffect(() => {
    if (!existing) return;

    setForm((prev) => ({
      ...prev,
      name: existing.name,
      contactNumber: existing.contactNumber,
      operatingHours: existing.operatingHours ?? "",
      description: existing.description ?? "",
      coverPhotoUrl: existing.coverPhotoUrl ?? "",
      latitude: existing.latitude,
      longitude: existing.longitude,
      priceTier: existing.priceTier,
    }));
  }, [existing]);

  /*
   * Set category and city for existing business
   */
  useEffect(() => {
    if (
      !existing ||
      categories.length === 0 ||
      cities.length === 0
    ) {
      return;
    }

    const category = categories.find(
      (c) => c.name === existing.categoryName
    );

    const city = cities.find(
      (c) => c.name === existing.cityName
    );

    setForm((prev) => ({
      ...prev,
      categoryId: category?.id ?? prev.categoryId,
      cityId: city?.id ?? prev.cityId,
    }));
  }, [existing, categories, cities]);

  /*
   * Load areas whenever city changes
   */
  useEffect(() => {
    if (!form.cityId) {
      setAreas([]);
      return;
    }

    referenceApi
      .areas(form.cityId)
      .then((list) => {
        setAreas(list);

        if (existing) {
          const area = list.find(
            (a) => a.name === existing.areaName
          );

          if (area) {
            setForm((prev) => ({
              ...prev,
              areaId: area.id,
            }));
          }
        }
      })
      .catch((err) => {
        setAreas([]);
        show(errorMessage(err), "error");
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cityId]);

  /*
   * Set attributes for existing business
   */
  useEffect(() => {
    if (!existing || attributes.length === 0) return;

    const ids = attributes
      .filter((a) =>
        existing.attributes.includes(a.name)
      )
      .map((a) => a.id);

    setForm((prev) => ({
      ...prev,
      attributeIds: ids,
    }));
  }, [existing, attributes]);

  /*
   * Clean preview URL
   */
  useEffect(() => {
    return () => {
      if (pendingCoverPreview) {
        URL.revokeObjectURL(pendingCoverPreview);
      }
    };
  }, [pendingCoverPreview]);

  /*
   * Generic form setter
   */
  function set<K extends keyof CreateBusinessRequest>(
    key: K,
    value: CreateBusinessRequest[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  /*
   * Toggle business attribute
   */
  function toggleAttribute(id: string) {
    setForm((prev) => ({
      ...prev,
      attributeIds: prev.attributeIds.includes(id)
        ? prev.attributeIds.filter((a) => a !== id)
        : [...prev.attributeIds, id],
    }));
  }

  /*
   * Use browser/device current location
   */
  function useMyLocationForPin() {
    if (!("geolocation" in navigator)) {
      show("Geolocation is not supported by this browser.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set(
          "latitude",
          Number(pos.coords.latitude.toFixed(6))
        );

        set(
          "longitude",
          Number(pos.coords.longitude.toFixed(6))
        );
      },
      (err) => {
        show(
          err.message || "Unable to get your location.",
          "error"
        );
      }
    );
  }

  /*
   * Upload cover photo for an existing business
   */
  async function handleCoverUpload(
    file: File | undefined
  ) {
    if (!file || !existing) return;

    setUploadingCover(true);

    try {
      const presigned =
        await galleryApi.requestUploadUrl(
          existing.id,
          file.name
        );

      await uploadFileToPresignedUrl(
        presigned.uploadUrl,
        file
      );

      set(
        "coverPhotoUrl",
        presigned.cdnUrlAfterUpload
      );

      show("Cover photo uploaded successfully.", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setUploadingCover(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  /*
   * Select cover photo BEFORE business creation.
   *
   * The file is only kept locally.
   * Actual upload happens after business creation.
   */
  function handlePendingCoverSelect(
    file: File | undefined
  ) {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      show(
        "Please select a JPG, PNG, or WebP image.",
        "error"
      );

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      return;
    }

    /*
     * Revoke previous preview URL
     */
    if (pendingCoverPreview) {
      URL.revokeObjectURL(pendingCoverPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setPendingCoverFile(file);
    setPendingCoverPreview(previewUrl);
  }

  /*
   * Upload a cover photo after the business has been created.
   */
  async function uploadCoverFor(
    businessId: string,
    file: File
  ): Promise<string> {
    const presigned =
      await galleryApi.requestUploadUrl(
        businessId,
        file.name
      );

    await uploadFileToPresignedUrl(
      presigned.uploadUrl,
      file
    );

    return presigned.cdnUrlAfterUpload;
  }

  /*
   * Submit business
   */
  async function submit() {
    setError(null);

    /*
     * Basic validation
     */
    if (
      !form.name ||
      !form.categoryId ||
      !form.cityId ||
      !form.areaId ||
      !form.contactNumber
    ) {
      setError(
        "Please fill in name, category, city, area, and contact number."
      );

      return;
    }

    setSubmitting(true);

    try {
      /*
       * EDIT EXISTING BUSINESS
       */
      if (existing) {
        const updated = await businessApi.update(
          existing.id,
          form
        );

        show("Listing updated", "success");

        router.push(`/business/${updated.slug}`);

        return;
      }

      /*
       * CREATE NEW BUSINESS
       */
      const created = await businessApi.create(form);

      /*
       * If a cover photo was selected before creation,
       * upload it now using the newly created business ID.
       */
      if (pendingCoverFile) {
        try {
          const cdnUrl = await uploadCoverFor(
            created.id,
            pendingCoverFile
          );

          /*
           * Update only the cover photo URL after upload.
           */
          await businessApi.update(created.id, {
            ...form,
            coverPhotoUrl: cdnUrl,
          });

          set("coverPhotoUrl", cdnUrl);

          show(
            "Listing and cover photo created successfully.",
            "success"
          );
        } catch (uploadError) {
          /*
           * Business itself was already created.
           * Only the image upload failed.
           */
          show(
            "Listing created, but the cover photo failed to upload. You can add it from Edit.",
            "error"
          );
        }
      } else {
        show("Listing created", "success");
      }

      router.push(`/owner/${created.id}/dashboard`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * Loading reference data
   */
  if (loadingRef) {
    return (
      <div className="py-16 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="space-y-5">

        {/* =========================
            Row 1 — Basic information
        ========================== */}
        <SectionCard>
          <SectionHeader
            step={1}
            title="Basic information"
            description="Tell customers what this business is called and does."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <div className="lg:col-span-1">
              <Label htmlFor="name">
                Business name
              </Label>

              <Input
                id="name"
                placeholder="e.g. Dhanmondi Hair Salon"
                value={form.name}
                onChange={(e) =>
                  set("name", e.target.value)
                }
              />
            </div>

            <div>
              <Label>Category</Label>

              <Select
                value={form.categoryId}
                onChange={(e) =>
                  set("categoryId", e.target.value)
                }
              >
                <option value="">
                  Select category
                </option>

                {categories.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Price tier</Label>

              <Select
                value={form.priceTier}
                onChange={(e) =>
                  set(
                    "priceTier",
                    e.target.value as PriceTier
                  )
                }
              >
                {Object.entries(
                  PRICE_TIER_LABELS
                ).map(([v, label]) => (
                  <option
                    key={v}
                    value={v}
                  >
                    {label}
                  </option>
                ))}
              </Select>
            </div>

          </div>
        </SectionCard>

        {/* =========================
            Row 2 — Location + Details
        ========================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Location */}
          <SectionCard>
            <SectionHeader
              step={2}
              title="Location"
              description="Where customers can find you, plus a map pin for search & directions."
            />

            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <Label>City</Label>

                  <Select
                    value={form.cityId}
                    onChange={(e) =>
                      set("cityId", e.target.value)
                    }
                  >
                    <option value="">
                      Select city
                    </option>

                    {cities.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                      >
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Area</Label>

                  <Select
                    value={form.areaId}
                    onChange={(e) =>
                      set("areaId", e.target.value)
                    }
                    disabled={!form.cityId}
                  >
                    <option value="">
                      Select area
                    </option>

                    {areas.map((a) => (
                      <option
                        key={a.id}
                        value={a.id}
                      >
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <Label htmlFor="lat">
                    Latitude
                  </Label>

                  <Input
                    id="lat"
                    type="number"
                    step="0.000001"
                    value={form.latitude}
                    onChange={(e) =>
                      set(
                        "latitude",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="lng">
                    Longitude
                  </Label>

                  <Input
                    id="lng"
                    type="number"
                    step="0.000001"
                    value={form.longitude}
                    onChange={(e) =>
                      set(
                        "longitude",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={useMyLocationForPin}
              >
                📍 Use my current location as the pin
              </Button>

              <FieldHint>
                Owner-side location entry is precise lat/lng
                (spec §17a) — an interactive drag-to-pin map
                can be dropped in here later; for now, enter
                coordinates directly or use your device's
                location.
              </FieldHint>

            </div>
          </SectionCard>

          {/* Contact & Details */}
          <SectionCard>
            <SectionHeader
              step={3}
              title="Contact & details"
              description="How to reach you and what to expect when customers visit."
            />

            <div className="space-y-4">

              {/* Contact */}
              <div>
                <Label htmlFor="contact">
                  Contact number
                </Label>

                <Input
                  id="contact"
                  placeholder="01712345678"
                  value={form.contactNumber}
                  onChange={(e) =>
                    set(
                      "contactNumber",
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Operating hours */}
              <div>
                <Label htmlFor="hours">
                  Operating hours
                </Label>

                <Textarea
                  id="hours"
                  placeholder={
                    "Sat–Thu: 10am – 9pm\nFriday: 3pm – 9pm"
                  }
                  value={
                    form.operatingHours ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "operatingHours",
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="desc">
                  Description
                </Label>

                <Textarea
                  id="desc"
                  placeholder="What makes this business worth visiting?"
                  value={
                    form.description ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "description",
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Cover Photo */}
              <div>
                <Label>
                  Cover photo
                </Label>

                {existing ? (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) =>
                        handleCoverUpload(
                          e.target.files?.[0]
                        )
                      }
                      className="text-xs text-ink-500"
                      disabled={uploadingCover}
                    />

                    {uploadingCover && (
                      <span className="ml-2 text-xs text-ink-400">
                        Uploading…
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) =>
                        handlePendingCoverSelect(
                          e.target.files?.[0]
                        )
                      }
                      className="text-xs text-ink-500"
                      disabled={submitting}
                    />

                    {pendingCoverFile && (
                      <p className="mt-1 text-xs text-ink-500">
                        Selected:{" "}
                        {pendingCoverFile.name}
                      </p>
                    )}
                  </>
                )}

                {/* Preview for newly selected image */}
                {pendingCoverPreview && !existing && (
                  <div className="mt-3">
                    <img
                      src={pendingCoverPreview}
                      alt="Cover preview"
                      className="w-full max-h-48 object-cover rounded-xl border border-ink-200"
                    />
                  </div>
                )}

                {/* Existing uploaded URL */}
                {form.coverPhotoUrl && (
                  <p className="mt-1 text-xs text-ink-400 truncate">
                    {form.coverPhotoUrl}
                  </p>
                )}
              </div>

              {/* Attributes */}
              <div>
                <Label>
                  Attributes
                </Label>

                <div className="flex flex-wrap gap-2">

                  {attributes.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() =>
                        toggleAttribute(a.id)
                      }
                      className={`text-xs rounded-full border px-3 py-1 transition-colors ${
                        form.attributeIds.includes(
                          a.id
                        )
                          ? "border-crimson-600 bg-crimson-50 text-crimson-800"
                          : "border-ink-200 text-ink-600 hover:border-ink-300"
                      }`}
                    >
                      {form.attributeIds.includes(
                        a.id
                      ) && "✓ "}
                      {a.name}
                    </button>
                  ))}

                </div>
              </div>

            </div>
          </SectionCard>
        </div>

        {/* =========================
            Actions
        ========================== */}
        <div className="flex justify-end gap-2 pt-2 pb-4">

          <Button
            variant="ghost"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            onClick={submit}
            loading={submitting}
          >
            {existing
              ? "Save changes"
              : "Create listing"}
          </Button>

        </div>

      </div>
    </div>
  );
}