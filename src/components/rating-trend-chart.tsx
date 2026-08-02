/**
 * Renders com.bdreview.platform.review.ReviewController#ratingTrend's raw
 * `List<Object[]>` result. The backend returns each row as a plain SQL
 * projection tuple (bucket label, average rating for that bucket) — since
 * the JSON shape is just a nested array with no field names, we defensively
 * read index 0 as the label and index 1 as the numeric value.
 */
export function RatingTrendChart({ rows }: { rows: unknown[][] }) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-ink-400">Not enough review history yet to show a trend.</p>;
  }

  const parsed = rows.map((row) => ({
    label: String(row[0] ?? ""),
    value: Number(row[1] ?? 0),
  }));
  const max = Math.max(5, ...parsed.map((p) => p.value));

  return (
    <div className="flex items-end gap-2 h-40">
      {parsed.map((p, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[11px] text-ink-500">{p.value.toFixed(1)}</span>
          <div className="w-full bg-ink-100 rounded-t overflow-hidden flex items-end" style={{ height: "100px" }}>
            <div
              className="w-full bg-brand-600 rounded-t"
              style={{ height: `${Math.max(4, (p.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-ink-400 truncate max-w-[3.5rem]">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
