"use client";

import { catalogApi } from "@/lib/api";
import type { Faq, FaqBody } from "@/lib/types";
import { Input, Label, Textarea } from "./ui/field";
import { ModuleListShell, type ModuleApi } from "./category-modules/module-list-shell";

interface Draft {
  question: string;
  answer: string;
}

/** Owner-managed FAQ list — business-wide, not category-scoped, so it isn't routed through CategoryModulesManager. */
export function BusinessFaqManager({ businessId }: { businessId: string }) {
  const api: ModuleApi<Faq> = {
    list: () => catalogApi.faqs(businessId),
    create: (b) => catalogApi.addFaq(businessId, b as FaqBody),
    update: (id, b) => catalogApi.updateFaq(businessId, id, b as FaqBody),
    remove: (id) => catalogApi.removeFaq(businessId, id),
    reorder: (ids) => catalogApi.reorderFaqs(businessId, ids),
  };

  return (
    <ModuleListShell<Faq, Draft>
      api={api}
      addLabel="Add a question"
      emptyHint="No FAQ entries yet."
      newDraft={() => ({ question: "", answer: "" })}
      fromItem={(f) => ({ question: f.question, answer: f.answer })}
      toBody={(d) => ({ question: d.question, answer: d.answer })}
      renderRow={(f) => (
        <div>
          <p className="text-sm font-semibold text-ink-900">{f.question}</p>
          <p className="mt-0.5 whitespace-pre-wrap text-xs text-ink-500">{f.answer}</p>
        </div>
      )}
      renderForm={(d, patch) => (
        <div className="grid gap-3">
          <div>
            <Label>Question</Label>
            <Input value={d.question} onChange={(e) => patch({ question: e.target.value })} placeholder="e.g. Do you have parking?" />
          </div>
          <div>
            <Label>Answer</Label>
            <Textarea value={d.answer} onChange={(e) => patch({ answer: e.target.value })} rows={3} />
          </div>
        </div>
      )}
    />
  );
}
