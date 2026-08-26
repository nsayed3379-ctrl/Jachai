"use client";

import { catalogApi } from "@/lib/api";
import type { TeamMember, TeamMemberBody } from "@/lib/types";
import { Input, Label, Textarea } from "../ui/field";
import { ModuleListShell, type ModuleApi } from "./module-list-shell";
import { ModulePhotoInput } from "./module-photo-input";

interface Draft {
  name: string;
  role: string;
  bio: string;
  photoUrl: string | null;
}

/** Doctors (CLINIC) / staff (SALON) / trainers (GYM) — one TeamMember table, kind-specific labels. */
export function TeamListEditor({
  businessId,
  addLabel,
  emptyHint,
  roleLabel = "Specialty / role",
}: {
  businessId: string;
  addLabel: string;
  emptyHint: string;
  roleLabel?: string;
}) {
  const api: ModuleApi<TeamMember> = {
    list: () => catalogApi.team(businessId),
    create: (b) => catalogApi.addTeamMember(businessId, b as TeamMemberBody),
    update: (id, b) => catalogApi.updateTeamMember(businessId, id, b as TeamMemberBody),
    remove: (id) => catalogApi.removeTeamMember(businessId, id),
    reorder: (ids) => catalogApi.reorderTeam(businessId, ids),
  };

  return (
    <ModuleListShell<TeamMember, Draft>
      api={api}
      addLabel={addLabel}
      emptyHint={emptyHint}
      newDraft={() => ({ name: "", role: "", bio: "", photoUrl: null })}
      fromItem={(t) => ({ name: t.name, role: t.role ?? "", bio: t.bio ?? "", photoUrl: t.photoUrl })}
      toBody={(d) => ({
        name: d.name,
        role: d.role || null,
        bio: d.bio || null,
        photoUrl: d.photoUrl || null,
      })}
      renderRow={(t) => (
        <div className="flex items-start gap-3">
          {t.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.photoUrl} alt="" className="h-10 w-10 flex-none rounded-full border border-ink-200 object-cover" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">{t.name}</p>
            {t.role && <p className="text-xs text-crimson-700">{t.role}</p>}
            {t.bio && <p className="mt-0.5 text-xs text-ink-500">{t.bio}</p>}
          </div>
        </div>
      )}
      renderForm={(d, patch) => (
        <div className="grid gap-3">
          <div>
            <Label>Name</Label>
            <Input value={d.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Dr. Ayesha Rahman" />
          </div>
          <div>
            <Label>
              {roleLabel} <span className="text-ink-300">(optional)</span>
            </Label>
            <Input value={d.role} onChange={(e) => patch({ role: e.target.value })} placeholder="e.g. Cardiologist" />
          </div>
          <div>
            <Label>
              Short bio <span className="text-ink-300">(optional)</span>
            </Label>
            <Textarea value={d.bio} onChange={(e) => patch({ bio: e.target.value })} rows={2} />
          </div>
          <ModulePhotoInput
            businessId={businessId}
            value={d.photoUrl}
            onChange={(url) => patch({ photoUrl: url })}
            label="Photo (optional)"
            shape="circle"
          />
        </div>
      )}
    />
  );
}
