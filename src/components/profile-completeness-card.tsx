"use client";

import type { CompletenessResponse } from "@/lib/types";

/**
 * Presentational profile-completeness widget for the owner dashboard. The
 * calculation lives entirely on the backend (GET /businesses/{id}/completeness);
 * this just renders the result. `onJump` (optional) lets a recommended item
 * deep-link to the relevant dashboard section.
 */
export function ProfileCompletenessCard({
  data,
  onJump,
}: {
  data: CompletenessResponse;
  onJump?: (itemKey: string) => void;
}) {
  const { percentage, completed, recommended } = data;

  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink-900">Profile completeness</h3>
        <span className="font-display text-2xl font-bold text-ink-900">{percentage}%</span>
      </div>

      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-crimson-600 to-crimson-500 transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {recommended.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Recommended next</p>
          <ul className="mt-2 space-y-1.5">
            {recommended.map((item) => (
              <li key={item.key} className="flex items-start gap-2 text-sm text-ink-700">
                <span aria-hidden className="mt-0.5 text-ink-300">○</span>
                {onJump ? (
                  <button type="button" onClick={() => onJump(item.key)} className="text-left hover:text-crimson-700 hover:underline">
                    {item.action ?? item.label}
                  </button>
                ) : (
                  <span>{item.action ?? item.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm font-medium text-emerald-700">✓ Your profile is complete.</p>
      )}

      {completed.length > 0 && (
        <details className="mt-3 text-xs text-ink-500">
          <summary className="cursor-pointer select-none">{completed.length} completed</summary>
          <ul className="mt-1.5 space-y-1">
            {completed.map((item) => (
              <li key={item.key} className="flex items-center gap-2">
                <span aria-hidden className="text-emerald-600">✓</span>
                {item.label}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
