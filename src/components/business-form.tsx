"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { businessApi, galleryApi, referenceApi, uploadFileToPresignedUrl } from "@/lib/api";
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
  longitude: 90.419559, // Dhanmondi, Dhaka — sensible default map center
  priceTier: "MODERATE",
  attributeIds: [],
};

export function BusinessForm({ existing }: Props) {
  const router = useRouter();
  const { show } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [attributes, setAttributes] = useState<BusinessAttribute[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);

  const [form, setForm] = useState<CreateBusinessRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([referenceApi.categories(), referenceApi.cities(), referenceApi.attributes()])
      .then(([cats, cityList, attrs]) => {
        setCategories(cats);
        setCities(cityList);
        setAttributes(attrs);
      })
      .finally(() => setLoadingRef(false));
  }, []);

  useEffect(() => {
    if (existing) {
      // We only have names from BusinessResponse, not ids — resolve ids
      // once reference data has loaded.
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
    }
  }, [existing]);

  useEffect(() => {
    if (!existing || categories.length === 0 || cities.length === 0) return;
    const category = categories.find((c) => c.name === existing.categoryName);
    const city = cities.find((c) => c.name === existing.cityName);
    setForm((prev) => ({
      ...prev,
      categoryId: category?.id ?? prev.categoryId,
      cityId: city?.id ?? prev.cityId,
    }));
  }, [existing, categories, cities]);

  useEffect(() => {
    if (!form.cityId) {
      setAreas([]);
      return;
    }
    referenceApi.areas(form.cityId).then((list) => {
      setAreas(list);
      if (existing) {
        const area = list.find((a) => a.name === existing.areaName);
        if (area) setForm((prev) => ({ ...prev, areaId: area.id }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cityId]);

  useEffect(() => {
    if (existing && attributes.length > 0) {
      const ids = attributes.filter((a) => existing.attributes.includes(a.name)).map((a) => a.id);
      setForm((prev) => ({ ...prev, attributeIds: ids }));
    }
  }, [existing, attributes]);

  function set<K extends keyof CreateBusinessRequest>(key: K, value: CreateBusinessRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAttribute(id: string) {
    setForm((prev) => ({
      ...prev,
      attributeIds: prev.attributeIds.includes(id)
        ? prev.attributeIds.filter((a) => a !== id)
        : [...prev.attributeIds, id],
    }));
  }

  function useMyLocationForPin() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      set("latitude", Number(pos.coords.latitude.toFixed(6)));
      set("longitude", Number(pos.coords.longitude.toFixed(6)));
    });
  }

  async function handleCoverUpload(file: File | undefined) {
    if (!file || !existing) return; // cover upload needs an existing businessId to scope the upload
    setUploadingCover(true);
    try {
      const presigned = await galleryApi.requestUploadUrl(existing.id, file.name);
      await uploadFileToPresignedUrl(presigned.uploadUrl, file);
      set("coverPhotoUrl", presigned.cdnUrlAfterUpload);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setUploadingCover(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit() {
    setError(null);
    if (!form.name || !form.categoryId || !form.cityId || !form.areaId || !form.contactNumber) {
      setError("Please fill in name, category, city, area, and contact number.");
      return;
    }
    setSubmitting(true);
    try {
      if (existing) {
        const updated = await businessApi.update(existing.id, form);
        show("Listing updated", "success");
        router.push(`/business/${updated.slug}`);
      } else {
        const created = await businessApi.create(form);
        show("Listing created", "success");
        router.push(`/owner/${created.id}/dashboard`);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingRef) {
    return (
      <div className="py-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      {error && <ErrorBanner message={error} />}

      <div>
        <Label htmlFor="name">Business name</Label>
        <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Price tier</Label>
          <Select value={form.priceTier} onChange={(e) => set("priceTier", e.target.value as PriceTier)}>
            {Object.entries(PRICE_TIER_LABELS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>City</Label>
          <Select value={form.cityId} onChange={(e) => set("cityId", e.target.value)}>
            <option value="">Select city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Area</Label>
          <Select value={form.areaId} onChange={(e) => set("areaId", e.target.value)} disabled={!form.cityId}>
            <option value="">Select area</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="contact">Contact number</Label>
        <Input
          id="contact"
          placeholder="01712345678"
          value={form.contactNumber}
          onChange={(e) => set("contactNumber", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="hours">Operating hours</Label>
        <Textarea
          id="hours"
          placeholder={"Sat–Thu: 10am – 9pm\nFriday: 3pm – 9pm"}
          value={form.operatingHours ?? ""}
          onChange={(e) => set("operatingHours", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="desc">Description</Label>
        <Textarea
          id="desc"
          placeholder="What makes this business worth visiting?"
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div>
        <Label>Cover photo</Label>
        {existing ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleCoverUpload(e.target.files?.[0])}
              className="text-xs text-ink-500"
            />
            {uploadingCover && <span className="ml-2 text-xs text-ink-400">Uploading…</span>}
          </>
        ) : (
          <FieldHint>Save the listing first, then upload a cover photo from the edit screen.</FieldHint>
        )}
        {form.coverPhotoUrl && (
          <p className="mt-1 text-xs text-ink-400 truncate">{form.coverPhotoUrl}</p>
        )}
      </div>

      <div>
        <Label>Attributes</Label>
        <div className="flex flex-wrap gap-2">
          {attributes.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => toggleAttribute(a.id)}
              className={`text-xs rounded-full border px-3 py-1 ${
                form.attributeIds.includes(a.id)
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-ink-200 text-ink-600"
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="0.000001"
            value={form.latitude}
            onChange={(e) => set("latitude", Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="0.000001"
            value={form.longitude}
            onChange={(e) => set("longitude", Number(e.target.value))}
          />
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={useMyLocationForPin}>
        📍 Use my current location as the pin
      </Button>
      <FieldHint>
        Owner-side location entry is precise lat/lng (spec §17a) — an interactive drag-to-pin map
        can be dropped in here later; for now, enter coordinates directly or use your device's location.
      </FieldHint>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={submit} loading={submitting}>
          {existing ? "Save changes" : "Create listing"}
        </Button>
      </div>
    </div>
  );
}
