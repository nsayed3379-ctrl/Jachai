"use client";

import { useEffect, useState } from "react";
import { businessApi, referenceApi } from "@/lib/api";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { Area, BusinessResponse, Category, City } from "@/lib/types";
import { StarDisplay } from "@/components/star-rating";
import { VerifiedBadge } from "@/components/verified-badge";
import { ClaimBusinessModal } from "@/components/claim-business-modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { PageSpinner } from "@/components/ui/misc";

export interface DuplicateCheckValues {
  name: string;
  categoryId: string;
  cityId: string;
  areaId: string;
}

/** Yelp-style pre-step: check for an existing near-match before the full "add a business" form opens. */
export function DuplicateCheckStep({ onContinue }: { onContinue: (values: DuplicateCheckValues) => void }) {
  const { show } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [areaId, setAreaId] = useState("");

  const [checking, setChecking] = useState(false);
  const [matches, setMatches] = useState<BusinessResponse[] | null>(null);
  const [claimTarget, setClaimTarget] = useState<BusinessResponse | null>(null);

  useEffect(() => {
    Promise.all([referenceApi.categories(), referenceApi.cities()])
      .then(([cats, cityList]) => {
        setCategories(cats);
        setCities(cityList);
      })
      .catch((err) => show(errorMessage(err), "error"))
      .finally(() => setLoadingRef(false));
  }, [show]);

  useEffect(() => {
    if (!cityId) {
      setAreas([]);
      setAreaId("");
      return;
    }
    referenceApi
      .areas(cityId)
      .then(setAreas)
      .catch(() => setAreas([]));
  }, [cityId]);

  async function check() {
    if (!name.trim() || !categoryId || !areaId) return;
    setChecking(true);
    try {
      const results = await businessApi.potentialDuplicates(categoryId, areaId, name.trim());
      if (results.length === 0) {
        onContinue({ name: name.trim(), categoryId, cityId, areaId });
      } else {
        setMatches(results);
      }
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setChecking(false);
    }
  }

  if (loadingRef) return <PageSpinner />;

  return (
    <div className="max-w-lg">
      {matches ? (
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Is one of these your business?</h2>
          <p className="text-sm text-ink-500 mt-1 mb-4">
            We found {matches.length === 1 ? "a business" : "businesses"} that look similar to yours — claiming an
            existing listing is faster than creating a duplicate.
          </p>
          <div className="space-y-3">
            {matches.map((b) => (
              <div
                key={b.id}
                className="rounded-lg border border-ink-100 bg-surface p-4 flex items-center justify-between gap-3 flex-wrap"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-semibold text-ink-900">{b.name}</p>
                    {b.verified && <VerifiedBadge compact />}
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {b.categoryName} · {b.areaName}, {b.cityName}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <StarDisplay rating={b.averageRating} size="sm" />
                    <span className="text-xs text-ink-500">
                      {b.averageRating.toFixed(1)} ({b.reviewCount})
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setClaimTarget(b)}>
                  Claim this business
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <button type="button" onClick={() => setMatches(null)} className="text-xs text-ink-400 hover:underline">
              ← Edit search
            </button>
            <Button variant="ghost" onClick={() => onContinue({ name: name.trim(), categoryId, cityId, areaId })}>
              None of these — create a new listing
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">First, let&apos;s check your business isn&apos;t already listed.</p>
          <div>
            <Label htmlFor="dup-name">Business name</Label>
            <Input id="dup-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. KFC" />
          </div>
          <div>
            <Label htmlFor="dup-category">Category</Label>
            <Select id="dup-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dup-city">City</Label>
              <Select id="dup-city" value={cityId} onChange={(e) => setCityId(e.target.value)}>
                <option value="">Select a city</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="dup-area">Area</Label>
              <Select id="dup-area" value={areaId} onChange={(e) => setAreaId(e.target.value)} disabled={!cityId}>
                <option value="">Select an area</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={check}
            loading={checking}
            disabled={!name.trim() || !categoryId || !areaId}
          >
            Continue
          </Button>
        </div>
      )}

      <ClaimBusinessModal
        open={claimTarget !== null}
        onClose={() => setClaimTarget(null)}
        businessId={claimTarget?.id ?? ""}
        businessName={claimTarget?.name ?? ""}
        onClaimed={() => setClaimTarget(null)}
      />
    </div>
  );
}
