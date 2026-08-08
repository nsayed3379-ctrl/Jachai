// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { businessApi, galleryApi, referenceApi, uploadFileToPresignedUrl } from "@/lib/api";
// import { PRICE_TIER_LABELS } from "@/lib/config";
// import { errorMessage, useToast } from "@/lib/toast-context";
// import type {
//   Area,
//   BusinessAttribute,
//   BusinessResponse,
//   Category,
//   City,
//   CreateBusinessRequest,
//   PriceTier,
// } from "@/lib/types";
// import { Button } from "./ui/button";
// import { FieldHint, Input, Label, Select, Textarea } from "./ui/field";
// import { ErrorBanner, Spinner } from "./ui/misc";

// interface Props {
//   existing?: BusinessResponse;
// }

// const emptyForm: CreateBusinessRequest = {
//   name: "",
//   categoryId: "",
//   cityId: "",
//   areaId: "",
//   contactNumber: "",
//   operatingHours: "",
//   description: "",
//   coverPhotoUrl: "",
//   latitude: 23.780636,
//   longitude: 90.419559, // Dhanmondi, Dhaka — sensible default map center
//   priceTier: "MODERATE",
//   attributeIds: [],
// };

// function SectionHeader({
//   step,
//   title,
//   description,
// }: {
//   step: number;
//   title: string;
//   description: string;
// }) {
//   return (
//     <div className="flex items-start gap-3 mb-4">
//       <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-crimson-600 to-crimson-500 text-xs font-semibold text-white shadow-sm">
//         {step}
//       </div>
//       <div>
//         <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
//         <p className="text-xs text-ink-400 mt-0.5">{description}</p>
//       </div>
//     </div>
//   );
// }

// function SectionCard({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="rounded-2xl border border-ink-200/70 bg-white shadow-sm p-5 md:p-6 h-full">
//       {children}
//     </div>
//   );
// }

// export function BusinessForm({ existing }: Props) {
//   const router = useRouter();
//   const { show } = useToast();

//   const [categories, setCategories] = useState<Category[]>([]);
//   const [cities, setCities] = useState<City[]>([]);
//   const [areas, setAreas] = useState<Area[]>([]);
//   const [attributes, setAttributes] = useState<BusinessAttribute[]>([]);
//   const [loadingRef, setLoadingRef] = useState(true);

//   const [form, setForm] = useState<CreateBusinessRequest>(emptyForm);
//   const [submitting, setSubmitting] = useState(false);
//   const [uploadingCover, setUploadingCover] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const fileRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     Promise.all([referenceApi.categories(), referenceApi.cities(), referenceApi.attributes()])
//       .then(([cats, cityList, attrs]) => {
//         setCategories(cats);
//         setCities(cityList);
//         setAttributes(attrs);
//       })
//       .finally(() => setLoadingRef(false));
//   }, []);

//   useEffect(() => {
//     if (existing) {
//       setForm((prev) => ({
//         ...prev,
//         name: existing.name,
//         contactNumber: existing.contactNumber,
//         operatingHours: existing.operatingHours ?? "",
//         description: existing.description ?? "",
//         coverPhotoUrl: existing.coverPhotoUrl ?? "",
//         latitude: existing.latitude,
//         longitude: existing.longitude,
//         priceTier: existing.priceTier,
//       }));
//     }
//   }, [existing]);

//   useEffect(() => {
//     if (!existing || categories.length === 0 || cities.length === 0) return;
//     const category = categories.find((c) => c.name === existing.categoryName);
//     const city = cities.find((c) => c.name === existing.cityName);
//     setForm((prev) => ({
//       ...prev,
//       categoryId: category?.id ?? prev.categoryId,
//       cityId: city?.id ?? prev.cityId,
//     }));
//   }, [existing, categories, cities]);

//   useEffect(() => {
//     if (!form.cityId) {
//       setAreas([]);
//       return;
//     }
//     referenceApi
//       .areas(form.cityId)
//       .then((list) => {
//         setAreas(list);
//         if (existing) {
//           const area = list.find((a) => a.name === existing.areaName);
//           if (area) setForm((prev) => ({ ...prev, areaId: area.id }));
//         }
//       })
//       .catch((err) => {
//         setAreas([]);
//         show(errorMessage(err), "error");
//       });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [form.cityId]);

//   useEffect(() => {
//     if (existing && attributes.length > 0) {
//       const ids = attributes.filter((a) => existing.attributes.includes(a.name)).map((a) => a.id);
//       setForm((prev) => ({ ...prev, attributeIds: ids }));
//     }
//   }, [existing, attributes]);

//   function set<K extends keyof CreateBusinessRequest>(key: K, value: CreateBusinessRequest[K]) {
//     setForm((prev) => ({ ...prev, [key]: value }));
//   }

//   function toggleAttribute(id: string) {
//     setForm((prev) => ({
//       ...prev,
//       attributeIds: prev.attributeIds.includes(id)
//         ? prev.attributeIds.filter((a) => a !== id)
//         : [...prev.attributeIds, id],
//     }));
//   }

//   function useMyLocationForPin() {
//     if (!("geolocation" in navigator)) return;
//     navigator.geolocation.getCurrentPosition((pos) => {
//       set("latitude", Number(pos.coords.latitude.toFixed(6)));
//       set("longitude", Number(pos.coords.longitude.toFixed(6)));
//     });
//   }

//   async function handleCoverUpload(file: File | undefined) {
//     if (!file || !existing) return;
//     setUploadingCover(true);
//     try {
//       const presigned = await galleryApi.requestUploadUrl(existing.id, file.name);
//       await uploadFileToPresignedUrl(presigned.uploadUrl, file);
//       set("coverPhotoUrl", presigned.cdnUrlAfterUpload);
//     } catch (err) {
//       show(errorMessage(err), "error");
//     } finally {
//       setUploadingCover(false);
//       if (fileRef.current) fileRef.current.value = "";
//     }
//   }

//   async function submit() {
//     setError(null);
//     if (!form.name || !form.categoryId || !form.cityId || !form.areaId || !form.contactNumber) {
//       setError("Please fill in name, category, city, area, and contact number.");
//       return;
//     }
//     setSubmitting(true);
//     try {
//       if (existing) {
//         const updated = await businessApi.update(existing.id, form);
//         show("Listing updated", "success");
//         router.push(`/business/${updated.slug}`);
//       } else {
//         const created = await businessApi.create(form);
//         show("Listing created", "success");
//         router.push(`/owner/${created.id}/dashboard`);
//       }
//     } catch (err) {
//       setError(errorMessage(err));
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   if (loadingRef) {
//     return (
//       <div className="py-16 flex justify-center">
//         <Spinner />
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-5xl mx-auto px-4">
//       {error && (
//         <div className="mb-5">
//           <ErrorBanner message={error} />
//         </div>
//       )}

//       <div className="space-y-5">
//         {/* Row 1 — Basic info (full width) */}
//         <SectionCard>
//           <SectionHeader
//             step={1}
//             title="Basic information"
//             description="Tell customers what this business is called and does."
//           />
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//             <div className="lg:col-span-1">
//               <Label htmlFor="name">Business name</Label>
//               <Input
//                 id="name"
//                 placeholder="e.g. Dhanmondi Hair Salon"
//                 value={form.name}
//                 onChange={(e) => set("name", e.target.value)}
//               />
//             </div>
//             <div>
//               <Label>Category</Label>
//               <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
//                 <option value="">Select category</option>
//                 {categories.map((c) => (
//                   <option key={c.id} value={c.id}>
//                     {c.name}
//                   </option>
//                 ))}
//               </Select>
//             </div>
//             <div>
//               <Label>Price tier</Label>
//               <Select value={form.priceTier} onChange={(e) => set("priceTier", e.target.value as PriceTier)}>
//                 {Object.entries(PRICE_TIER_LABELS).map(([v, label]) => (
//                   <option key={v} value={v}>
//                     {label}
//                   </option>
//                 ))}
//               </Select>
//             </div>
//           </div>
//         </SectionCard>

//         {/* Row 2 — Location (left) + Contact & details (right) */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
//           <SectionCard>
//             <SectionHeader
//               step={2}
//               title="Location"
//               description="Where customers can find you, plus a map pin for search & directions."
//             />
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label>City</Label>
//                   <Select value={form.cityId} onChange={(e) => set("cityId", e.target.value)}>
//                     <option value="">Select city</option>
//                     {cities.map((c) => (
//                       <option key={c.id} value={c.id}>
//                         {c.name}
//                       </option>
//                     ))}
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>Area</Label>
//                   <Select
//                     value={form.areaId}
//                     onChange={(e) => set("areaId", e.target.value)}
//                     disabled={!form.cityId}
//                   >
//                     <option value="">Select area</option>
//                     {areas.map((a) => (
//                       <option key={a.id} value={a.id}>
//                         {a.name}
//                       </option>
//                     ))}
//                   </Select>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="lat">Latitude</Label>
//                   <Input
//                     id="lat"
//                     type="number"
//                     step="0.000001"
//                     value={form.latitude}
//                     onChange={(e) => set("latitude", Number(e.target.value))}
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="lng">Longitude</Label>
//                   <Input
//                     id="lng"
//                     type="number"
//                     step="0.000001"
//                     value={form.longitude}
//                     onChange={(e) => set("longitude", Number(e.target.value))}
//                   />
//                 </div>
//               </div>

//               <button
//                 type="button"
//                 onClick={useMyLocationForPin}
//                 className="inline-flex items-center gap-1.5 text-xs font-medium text-crimson-600 hover:text-crimson-700 transition-colors"
//               >
//                 <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M12 2v2m0 16v2M4 12H2m20 0h-2m-3-7l-1.5 1.5M6.5 17.5L5 19m14 0l-1.5-1.5M6.5 6.5L5 5"
//                   />
//                   <circle cx="12" cy="12" r="4" strokeWidth={2} />
//                 </svg>
//                 Use my current location as the pin
//               </button>
//               <FieldHint>
//                 Owner-side location entry is precise lat/lng — an interactive drag-to-pin map can
//                 be dropped in here later; for now, enter coordinates directly or use your
//                 device&apos;s location.
//               </FieldHint>
//             </div>
//           </SectionCard>

//           <SectionCard>
//             <SectionHeader
//               step={3}
//               title="Contact & details"
//               description="How to reach you and what to expect when customers visit."
//             />
//             <div className="space-y-4">
//               <div>
//                 <Label htmlFor="contact">Contact number</Label>
//                 <Input
//                   id="contact"
//                   placeholder="01712345678"
//                   value={form.contactNumber}
//                   onChange={(e) => set("contactNumber", e.target.value)}
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="hours">Operating hours</Label>
//                 <Textarea
//                   id="hours"
//                   placeholder={"Sat–Thu: 10am – 9pm\nFriday: 3pm – 9pm"}
//                   value={form.operatingHours ?? ""}
//                   onChange={(e) => set("operatingHours", e.target.value)}
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="desc">Description</Label>
//                 <Textarea
//                   id="desc"
//                   placeholder="What makes this business worth visiting?"
//                   value={form.description ?? ""}
//                   onChange={(e) => set("description", e.target.value)}
//                 />
//               </div>
//             </div>
//           </SectionCard>
//         </div>

//         {/* Row 3 — Attributes (left) + Cover photo (right) */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
//           {attributes.length > 0 && (
//             <SectionCard>
//               <SectionHeader
//                 step={4}
//                 title="Attributes"
//                 description="Highlight amenities and features customers care about."
//               />
//               <div className="flex flex-wrap gap-2">
//                 {attributes.map((a) => {
//                   const selected = form.attributeIds.includes(a.id);
//                   return (
//                     <button
//                       key={a.id}
//                       type="button"
//                       onClick={() => toggleAttribute(a.id)}
//                       className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full border px-3.5 py-1.5 transition-colors ${
//                         selected
//                           ? "border-crimson-600 bg-crimson-50 text-crimson-800"
//                           : "border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50"
//                       }`}
//                     >
//                       {selected && (
//                         <svg
//                           className="h-3 w-3"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                           stroke="currentColor"
//                           strokeWidth={3}
//                         >
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                         </svg>
//                       )}
//                       {a.name}
//                     </button>
//                   );
//                 })}
//               </div>
//             </SectionCard>
//           )}

//           <SectionCard>
//             <SectionHeader
//               step={5}
//               title="Cover photo"
//               description="The first image customers see on your listing."
//             />
//             {existing ? (
//               <div className="flex items-center gap-3">
//                 <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-ink-300 px-4 py-2.5 text-xs font-medium text-ink-600 hover:border-crimson-400 hover:text-crimson-700 cursor-pointer transition-colors">
//                   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
//                     />
//                   </svg>
//                   {uploadingCover ? "Uploading…" : "Choose image"}
//                   <input
//                     ref={fileRef}
//                     type="file"
//                     accept="image/jpeg,image/png,image/webp"
//                     onChange={(e) => handleCoverUpload(e.target.files?.[0])}
//                     className="hidden"
//                     disabled={uploadingCover}
//                   />
//                 </label>
//                 {uploadingCover && <Spinner />}
//               </div>
//             ) : (
//               <FieldHint>Save the listing first, then upload a cover photo from the edit screen.</FieldHint>
//             )}
//             {form.coverPhotoUrl && (
//               <p className="mt-2 text-xs text-ink-400 truncate">{form.coverPhotoUrl}</p>
//             )}
//           </SectionCard>
//         </div>

//         {/* Actions */}
//         <div className="flex justify-end gap-2 pt-1 pb-4">
//           <Button variant="ghost" onClick={() => router.back()}>
//             Cancel
//           </Button>
//           <Button
//             onClick={submit}
//             loading={submitting}
//             className="bg-gradient-to-r from-crimson-600 to-crimson-500 hover:from-crimson-700 hover:to-crimson-600"
//           >
//             {existing ? "Save changes" : "Create listing"}
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }


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

  const [form, setForm] = useState<CreateBusinessRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // For the "create new business" flow: no businessId exists yet to scope an
  // upload to, so we hold the picked file locally and upload it right after
  // the business is created, then patch coverPhotoUrl onto it.
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [pendingCoverPreview, setPendingCoverPreview] = useState<string | null>(null);

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
    referenceApi
      .areas(form.cityId)
      .then((list) => {
        setAreas(list);
        if (existing) {
          const area = list.find((a) => a.name === existing.areaName);
          if (area) setForm((prev) => ({ ...prev, areaId: area.id }));
        }
      })
      .catch((err) => {
        setAreas([]);
        show(errorMessage(err), "error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cityId]);

  useEffect(() => {
    if (existing && attributes.length > 0) {
      const ids = attributes.filter((a) => existing.attributes.includes(a.name)).map((a) => a.id);
      setForm((prev) => ({ ...prev, attributeIds: ids }));
    }
  }, [existing, attributes]);

  // Clean up the local object-URL preview when it changes or on unmount.
  useEffect(() => {
    return () => {
      if (pendingCoverPreview) URL.revokeObjectURL(pendingCoverPreview);
    };
  }, [pendingCoverPreview]);

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

  async function uploadCoverFor(businessId: string, file: File) {
    const presigned = await galleryApi.requestUploadUrl(businessId, file.name);
    const ok = await uploadFileToPresignedUrl(presigned.uploadUrl, file);
    if (!ok) throw new Error("Upload failed");
    return presigned.cdnUrlAfterUpload;
  }

  async function handleCoverFileChange(file: File | undefined) {
    if (!file) return;

    if (existing) {
      // Editing an existing business — we already have an id, so upload right away.
      setUploadingCover(true);
      try {
        const cdnUrl = await uploadCoverFor(existing.id, file);
        set("coverPhotoUrl", cdnUrl);
      } catch (err) {
        show(errorMessage(err), "error");
      } finally {
        setUploadingCover(false);
        if (fileRef.current) fileRef.current.value = "";
      }
      return;
    }

    // Creating a new business — no id yet, hold the file and show a local preview.
    if (pendingCoverPreview) URL.revokeObjectURL(pendingCoverPreview);
    setPendingCoverFile(file);
    setPendingCoverPreview(URL.createObjectURL(file));
  }

  function clearPendingCover() {
    if (pendingCoverPreview) URL.revokeObjectURL(pendingCoverPreview);
    setPendingCoverFile(null);
    setPendingCoverPreview(null);
    if (fileRef.current) fileRef.current.value = "";
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

        // If a cover photo was picked before the business existed, upload it
        // now that we have an id, then patch the URL onto the new listing.
        if (pendingCoverFile) {
          try {
            const cdnUrl = await uploadCoverFor(created.id, pendingCoverFile);
            await businessApi.update(created.id, { ...form, coverPhotoUrl: cdnUrl });
          } catch (err) {
            // Listing itself was created successfully — don't block navigation,
            // just let the owner know the photo needs to be re-added.
            show("Listing created, but the cover photo failed to upload. You can add it from Edit.", "error");
          }
        }

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
        {/* Row 1 — Basic info (full width) */}
        <SectionCard>
          <SectionHeader
            step={1}
            title="Basic information"
            description="Tell customers what this business is called and does."
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <Label htmlFor="name">Business name</Label>
              <Input
                id="name"
                placeholder="e.g. Dhanmondi Hair Salon"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
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
          </div>
        </SectionCard>

        {/* Row 2 — Location (left) + Contact & details (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
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
                  <Select
                    value={form.areaId}
                    onChange={(e) => set("areaId", e.target.value)}
                    disabled={!form.cityId}
                  >
                    <option value="">Select area</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
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

              <button
                type="button"
                onClick={useMyLocationForPin}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-crimson-600 hover:text-crimson-700 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 2v2m0 16v2M4 12H2m20 0h-2m-3-7l-1.5 1.5M6.5 17.5L5 19m14 0l-1.5-1.5M6.5 6.5L5 5"
                  />
                  <circle cx="12" cy="12" r="4" strokeWidth={2} />
                </svg>
                Use my current location as the pin
              </button>
              <FieldHint>
                Owner-side location entry is precise lat/lng — an interactive drag-to-pin map can
                be dropped in here later; for now, enter coordinates directly or use your
                device&apos;s location.
              </FieldHint>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeader
              step={3}
              title="Contact & details"
              description="How to reach you and what to expect when customers visit."
            />
            <div className="space-y-4">
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
            </div>
          </SectionCard>
        </div>

        {/* Row 3 — Attributes (left) + Cover photo (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {attributes.length > 0 && (
            <SectionCard>
              <SectionHeader
                step={4}
                title="Attributes"
                description="Highlight amenities and features customers care about."
              />
              <div className="flex flex-wrap gap-2">
                {attributes.map((a) => {
                  const selected = form.attributeIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAttribute(a.id)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full border px-3.5 py-1.5 transition-colors ${
                        selected
                          ? "border-crimson-600 bg-crimson-50 text-crimson-800"
                          : "border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50"
                      }`}
                    >
                      {selected && (
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          )}

          <SectionCard>
            <SectionHeader
              step={5}
              title="Cover photo"
              description="The first image customers see on your listing."
            />

            {/* Editing an existing business: upload happens immediately */}
            {existing && (
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-ink-300 px-4 py-2.5 text-xs font-medium text-ink-600 hover:border-crimson-400 hover:text-crimson-700 cursor-pointer transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  {uploadingCover ? "Uploading…" : "Choose image"}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleCoverFileChange(e.target.files?.[0])}
                    className="hidden"
                    disabled={uploadingCover}
                  />
                </label>
                {uploadingCover && <Spinner />}
              </div>
            )}

            {/* Creating a new business: pick a file now, it uploads right after
                the listing is created (no businessId exists yet to scope the
                upload to). */}
            {!existing && (
              <div className="space-y-3">
                {pendingCoverPreview ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={pendingCoverPreview}
                      alt="Cover preview"
                      className="h-16 w-16 rounded-lg object-cover border border-ink-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink-700 truncate">
                        {pendingCoverFile?.name}
                      </p>
                      <p className="text-[11px] text-ink-400">Uploads once you create the listing</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearPendingCover}
                      className="text-xs text-ink-400 hover:text-crimson-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-ink-300 px-4 py-2.5 text-xs font-medium text-ink-600 hover:border-crimson-400 hover:text-crimson-700 cursor-pointer transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    Choose image
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleCoverFileChange(e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                )}
                <FieldHint>Optional — you can also add this later from the edit screen.</FieldHint>
              </div>
            )}

            {existing && form.coverPhotoUrl && (
              <p className="mt-2 text-xs text-ink-400 truncate">{form.coverPhotoUrl}</p>
            )}
          </SectionCard>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1 pb-4">
          <Button variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            loading={submitting}
            className="bg-gradient-to-r from-crimson-600 to-crimson-500 hover:from-crimson-700 hover:to-crimson-600"
          >
            {existing ? "Save changes" : "Create listing"}
          </Button>
        </div>
      </div>
    </div>
  );
}