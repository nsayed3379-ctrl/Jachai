"use client";

import { flushSync } from "react-dom";
import { Bold, Code, Code2, Heading2, Italic, Link2, List, ListOrdered, Quote, Strikethrough, Table2, type LucideIcon } from "lucide-react";

/**
 * Lightweight Markdown-syntax toolbar for a plain <textarea> — no WYSIWYG
 * editor dependency (Community V1 stays text-only; body is stored as plain
 * Markdown source, same TEXT column/5000-char limit as before). Buttons
 * insert/wrap Markdown at the cursor or around the current selection.
 * Deliberately excludes image/video (Community V1 has no media upload) and
 * superscript/subscript (no safe standard-Markdown syntax for it without
 * allowing raw HTML, which would reopen an XSS hole — see CommunityMarkdown).
 *
 * Two correctness rules that took two rounds to get right, both about not
 * racing the browser/React:
 * 1. Always read the CURRENT text off the DOM (`el.value`), never off the
 *    `value` prop closure — the prop can be one render behind the DOM if a
 *    button is clicked again (or the user types) before React has committed
 *    the previous click's state update, which silently discarded that edit.
 * 2. Apply the state update via flushSync and set focus/selection
 *    immediately after, in the same synchronous block — the previous
 *    requestAnimationFrame-deferred approach left a window (until the next
 *    paint) where a fast next keystroke landed at the pre-click cursor
 *    position instead of where the click had just moved it.
 */
export function CommunityMarkdownToolbar({
  textareaRef,
  onChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onChange: (next: string) => void;
}) {
  /** Commits `next`, then synchronously (no rAF gap) focuses the textarea and selects [selStart, selEnd) in the NEW text. */
  function commit(next: string, selStart: number, selEnd: number) {
    flushSync(() => onChange(next));
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(selStart, selEnd);
  }

  /** Wraps the current selection in `before`/`after` (e.g. **bold**); with no selection, inserts placeholder text pre-selected so typing replaces it. */
  function wrapSelection(before: string, after: string, placeholder: string) {
    const el = textareaRef.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    const selStart = start + before.length;
    commit(next, selStart, selStart + selected.length);
  }

  /** Prefixes every line touched by the selection with `prefix` (e.g. "- ", "> "). */
  function prefixLines(prefix: string | ((lineIndex: number) => string)) {
    const el = textareaRef.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndIdx = value.indexOf("\n", end);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
    const block = value.slice(lineStart, lineEnd);
    const lines = block.split("\n");
    const prefixed = lines.map((line, i) => (typeof prefix === "string" ? prefix : prefix(i)) + line).join("\n");
    const next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
    commit(next, lineStart, lineStart + prefixed.length);
  }

  function insertLink() {
    const el = textareaRef.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const text = selected || "link text";
    const insert = `[${text}](url)`;
    const next = value.slice(0, start) + insert + value.slice(end);
    // Select "url" so typing the address is a single keystroke away.
    const urlStart = start + text.length + 3;
    commit(next, urlStart, urlStart + 3);
  }

  function insertTable() {
    const el = textareaRef.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart;
    const needsLeadingNewline = start > 0 && value[start - 1] !== "\n";
    const template = `${needsLeadingNewline ? "\n" : ""}| Column 1 | Column 2 |\n| --- | --- |\n| | |\n`;
    const next = value.slice(0, start) + template + value.slice(start);
    commit(next, start + template.length, start + template.length);
  }

  type ToolbarButton = { icon: LucideIcon; title: string; onClick: () => void };
  const groups: ToolbarButton[][] = [
    [
      { icon: Bold, title: "Bold", onClick: () => wrapSelection("**", "**", "bold text") },
      { icon: Italic, title: "Italic", onClick: () => wrapSelection("*", "*", "italic text") },
      { icon: Strikethrough, title: "Strikethrough", onClick: () => wrapSelection("~~", "~~", "strikethrough") },
      { icon: Heading2, title: "Heading", onClick: () => prefixLines("## ") },
    ],
    [
      { icon: Link2, title: "Link", onClick: insertLink },
      { icon: List, title: "Bullet list", onClick: () => prefixLines("- ") },
      { icon: ListOrdered, title: "Numbered list", onClick: () => prefixLines((i) => `${i + 1}. `) },
      { icon: Quote, title: "Quote", onClick: () => prefixLines("> ") },
    ],
    [
      { icon: Code, title: "Inline code", onClick: () => wrapSelection("`", "`", "code") },
      { icon: Code2, title: "Code block", onClick: () => wrapSelection("```\n", "\n```", "code") },
      { icon: Table2, title: "Table", onClick: insertTable },
    ],
  ];

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-0.5">
          {groupIndex > 0 && <span className="mx-1 h-4 w-px shrink-0 bg-ink-200" aria-hidden="true" />}
          {group.map((b) => (
            <button
              key={b.title}
              type="button"
              title={b.title}
              // A real mouse click fires mousedown -> blur (shifts focus to the
              // button) -> click; by the time onClick ran, some browsers had
              // already cleared the textarea's visible selection, so the wrap
              // landed in the wrong place or looked like nothing happened.
              // Preventing default on mousedown keeps the textarea focused (and
              // its selection intact) through the whole click.
              onMouseDown={(e) => e.preventDefault()}
              onClick={b.onClick}
              tabIndex={-1}
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-500 transition-colors duration-150 hover:bg-ink-200 hover:text-ink-900 active:scale-90"
            >
              <b.icon size={15} strokeWidth={2} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
