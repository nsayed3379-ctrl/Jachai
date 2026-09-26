"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { userApi, uploadFileToPresignedUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCommunityUsernameModal } from "@/lib/community-username-modal-context";
import { useLanguage } from "@/lib/language-context";
import { errorMessage, useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/misc";
import { AvatarPicker } from "./avatar-picker";
import { ScreenHeader } from "./screen-header";

/**
 * Community avatar saves immediately on each pick/remove (its own endpoint, no Done step)
 * — same as the old page's behaviour, kept deliberately separate from Edit profile's
 * batched save since this is a distinct, pseudonymous identity from the account itself.
 */
export function CommunityProfileScreen() {
  const { profile, setProfile: setAuthProfile } = useAuth();
  const { t } = useLanguage();
  const { show } = useToast();
  const { openModal } = useCommunityUsernameModal();
  const [uploading, setUploading] = useState(false);

  if (!profile) return <PageSpinner />;

  async function handleSelectFile(file: File) {
    setUploading(true);
    try {
      const presigned = await userApi.requestCommunityAvatarUploadUrl(file.name);
      await uploadFileToPresignedUrl(presigned.uploadUrl, file);
      const updated = await userApi.updateCommunityAvatar(presigned.cdnUrlAfterUpload);
      setAuthProfile(updated);
      show(t("account.community_avatar.toast.updated"), "success");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setUploading(true);
    try {
      const updated = await userApi.updateCommunityAvatar(null);
      setAuthProfile(updated);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setUploading(false);
    }
  }

  if (!profile.communityUsername) {
    return (
      <div>
        <ScreenHeader title="Community profile" />
        <div className="mx-auto max-w-sm px-4 py-10 text-center md:max-w-none md:px-0">
          <p className="text-sm text-ink-500">{t("account.community_avatar.no_username_hint")}</p>
          <Button className="mt-4" onClick={() => openModal()}>
            Set up username
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader title="Community profile" />
      <div className="mx-auto max-w-sm px-4 pb-10 pt-6 text-center md:max-w-none md:px-0">
        <AvatarPicker
          imageUrl={profile.communityAvatarUrl}
          fallback={
            <span className="text-lg font-bold text-crimson-700">{profile.communityUsername.slice(0, 2).toUpperCase()}</span>
          }
          onSelectFile={handleSelectFile}
          onRemove={profile.communityAvatarUrl ? handleRemove : undefined}
          ariaLabel="Change community avatar"
          uploading={uploading}
        />
        <p className="mt-3 text-sm font-medium text-ink-900 dark:text-ink-100">u/{profile.communityUsername}</p>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-ink-50 p-3 text-left text-sm text-ink-600 dark:bg-ink-800 dark:text-ink-300">
          <Lock size={16} className="mt-0.5 shrink-0" strokeWidth={1.75} />
          <p>{t("account.community_avatar.hint")}</p>
        </div>
      </div>
    </div>
  );
}
