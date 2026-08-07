"use client";

import { useEffect, useRef, useState } from "react";
import { userApi, uploadFileToPresignedUrl } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { PreferredLanguage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { ErrorBanner, PageSpinner } from "@/components/ui/misc";

function AccountContent() {
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>("en");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    userApi
      .me()
      .then((profile) => {
        setPhoneNumber(profile.phoneNumber);
        setName(profile.name ?? "");
        setPreferredLanguage(profile.preferredLanguage);
        setProfilePhotoUrl(profile.profilePhotoUrl);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handlePhotoUpload(file: File | undefined) {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const presigned = await userApi.requestPhotoUploadUrl(file.name);
      await uploadFileToPresignedUrl(presigned.uploadUrl, file);
      setProfilePhotoUrl(presigned.cdnUrlAfterUpload);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setUploadingPhoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    setSaving(true);
    try {
      await userApi.update(name.trim() || null, preferredLanguage, profilePhotoUrl);
      show("Profile updated", "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-2xl font-bold text-ink-900 text-center">Account settings</h1>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="phone">Mobile number</Label>
          <Input id="phone" value={phoneNumber} disabled />
        </div>

        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Label>Profile picture</Label>
          <div className="flex items-center gap-3">
            {profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profilePhotoUrl}
                alt="Profile"
                className="h-12 w-12 rounded-full object-cover border border-ink-200"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-ink-100 border border-ink-200" />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
              className="text-xs text-ink-500"
            />
          </div>
          {uploadingPhoto && <span className="text-xs text-ink-400">Uploading…</span>}
        </div>

        <div>
          <Label>Language</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPreferredLanguage("en")}
              className={`rounded border px-3 py-2 text-sm ${
                preferredLanguage === "en" ? "border-crimson-600 bg-crimson-50 text-crimson-800" : "border-ink-200 text-ink-600"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setPreferredLanguage("bn")}
              className={`rounded border px-3 py-2 text-sm ${
                preferredLanguage === "bn" ? "border-crimson-600 bg-crimson-50 text-crimson-800" : "border-ink-200 text-ink-600"
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>

        <Button className="w-full" onClick={save} loading={saving || uploadingPhoto}>
          Save
        </Button>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RoleGate allow={["CONSUMER", "BUSINESS_OWNER", "ADMIN"]}>
      <AccountContent />
    </RoleGate>
  );
}
