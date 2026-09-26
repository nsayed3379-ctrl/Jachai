"use client";

import { autoReplyApi } from "@/lib/api";
import type { AutoReply, AutoReplyBody } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/misc";
import { Input, Label, Textarea } from "./ui/field";
import { ModuleListShell, type ModuleApi } from "./category-modules/module-list-shell";

interface Draft {
  question: string;
  answer: string;
}

const LANGUAGE_LABEL: Record<string, string> = { en: "EN", bn: "BN" };

/** Owner-managed quick-reply shortcuts for the chat widget — business-wide, not
 *  category-scoped, same pattern as BusinessFaqManager. A fresh business already
 *  has a starter set (seeded server-side on first read); owners edit those in
 *  place, delete ones they don't want, and add their own. */
export function BusinessAutoReplyManager({ businessId }: { businessId: string }) {
  const api: ModuleApi<AutoReply> = {
    list: () => autoReplyApi.list(businessId),
    create: (b) => autoReplyApi.create(businessId, b as AutoReplyBody),
    update: (id, b) => autoReplyApi.update(businessId, id, b as AutoReplyBody),
    remove: (id) => autoReplyApi.remove(businessId, id),
    reorder: (ids) => autoReplyApi.reorder(businessId, ids),
  };

  return (
    <ModuleListShell<AutoReply, Draft>
      api={api}
      addLabel="Add a quick reply"
      emptyHint="No quick replies yet."
      newDraft={() => ({ question: "", answer: "" })}
      fromItem={(r) => ({ question: r.question, answer: r.answer })}
      toBody={(d) => ({ question: d.question, answer: d.answer })}
      renderRow={(r) => (
        <div>
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink-900">
            {r.question}
            {r.systemDefault && <Badge tone="neutral">Default</Badge>}
            {r.language && (
              <span className={cn("text-[10px] font-bold uppercase tracking-wide text-ink-400")}>
                {LANGUAGE_LABEL[r.language] ?? r.language}
              </span>
            )}
          </p>
          <p className="mt-0.5 whitespace-pre-wrap text-xs text-ink-500">{r.answer}</p>
        </div>
      )}
      renderForm={(d, patch) => (
        <div className="grid gap-3">
          <div>
            <Label>Question (shown as a tappable chip)</Label>
            <Input value={d.question} onChange={(e) => patch({ question: e.target.value })} placeholder="e.g. Do you have parking?" />
          </div>
          <div>
            <Label>Answer (sent automatically when a customer taps it)</Label>
            <Textarea value={d.answer} onChange={(e) => patch({ answer: e.target.value })} rows={3} />
          </div>
        </div>
      )}
    />
  );
}
