"use client";

import { useEffect, useRef, useState } from "react";
import { userApi, uploadFileToPresignedUrl } from "@/lib/api";
import { RoleGate } from "@/components/role-gate";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useTheme } from "@/lib/theme-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import type { PreferredLanguage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { ErrorBanner, PageSpinner } from "@/components/ui/misc";

function AccountContent() {
  const { show } = useToast();
  const { setProfile: setAuthProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
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
        setAuthProfile(profile);
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
      const updated = await userApi.update(name.trim() || null, preferredLanguage, profilePhotoUrl);
      setAuthProfile(updated);
      show(t("account.toast.updated"), "success");
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
      <h1 className="font-display text-2xl font-bold text-ink-900 text-center">{t("account.title")}</h1>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="phone">{t("account.mobile_number")}</Label>
          <Input id="phone" value={phoneNumber} disabled />
        </div>

        <div>
          <Label htmlFor="name">{t("account.name")}</Label>
          <Input
            id="name"
            placeholder={t("account.name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Label>{t("account.profile_picture")}</Label>
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
          {uploadingPhoto && <span className="text-xs text-ink-400">{t("account.uploading")}</span>}
        </div>

        <div>
          <Label>{t("account.language")}</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPreferredLanguage("en")}
              className={`rounded border px-3 py-2 text-sm ${
                preferredLanguage === "en" ? "border-crimson-600 bg-crimson-50 text-crimson-800" : "border-ink-200 text-ink-600"
              }`}
            >
              {t("account.language.en")}
            </button>
            <button
              type="button"
              onClick={() => setPreferredLanguage("bn")}
              className={`rounded border px-3 py-2 text-sm ${
                preferredLanguage === "bn" ? "border-crimson-600 bg-crimson-50 text-crimson-800" : "border-ink-200 text-ink-600"
              }`}
            >
              {t("account.language.bn")}
            </button>
          </div>
        </div>

        <div>
          <Label>{t("account.appearance")}</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`rounded border px-3 py-2 text-sm ${
                theme === "light" ? "border-crimson-600 bg-crimson-50 text-crimson-800" : "border-ink-200 text-ink-600"
              }`}
            >
              {t("account.theme.light")}
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`rounded border px-3 py-2 text-sm ${
                theme === "dark" ? "border-crimson-600 bg-crimson-50 text-crimson-800" : "border-ink-200 text-ink-600"
              }`}
            >
              {t("account.theme.dark")}
            </button>
          </div>
        </div>

        <Button className="w-full" onClick={save} loading={saving || uploadingPhoto}>
          {t("account.save")}
        </Button>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RoleGate>
      <AccountContent />
    </RoleGate>
  );
}