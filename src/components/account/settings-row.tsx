"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn, focusRing, interactiveTransition } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const rowBase = cn("flex min-h-14 w-full items-center gap-3 px-4 text-left", interactiveTransition, focusRing);

function RowIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
      <Icon size={19} strokeWidth={1.75} />
    </span>
  );
}

function RowLabel({ label, description }: { label: string; description?: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[15px] font-medium text-ink-900 dark:text-ink-100">{label}</span>
      {description && <span className="block truncate text-[13px] text-ink-500">{description}</span>}
    </span>
  );
}

/** Full-bleed on mobile (edges touch the screen), a bordered rounded card from `sm` up —
 *  matches the site shell's own px-4 -> sm:px-6 pivot so the card's inset content still
 *  lines up with the rest of the page at every width. */
export function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "-mx-4 divide-y divide-ink-100 bg-surface sm:mx-0 sm:rounded-xl sm:border sm:border-ink-100 dark:divide-ink-800 sm:dark:border-ink-800",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SettingsSectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="px-4 pb-2 pt-6 text-[13px] font-semibold text-ink-500">{children}</p>;
}

interface RowShellProps {
  icon?: LucideIcon;
  label: string;
  description?: string;
  className?: string;
}

/** Navigates (Link, if `href`) or fires a click handler — always ends in a chevron.
 *  Used for both "drill into a screen" and "trigger an async action" rows (e.g. switch
 *  account), since both are equally "this row does something when tapped". */
export function SettingsNavRow({
  icon,
  label,
  description,
  value,
  href,
  onClick,
  disabled,
  className,
}: RowShellProps & { value?: string; href?: string; onClick?: () => void; disabled?: boolean }) {
  const content = (
    <>
      {icon && <RowIcon icon={icon} />}
      <RowLabel label={label} description={description} />
      {value && <span className="max-w-[40%] shrink-0 truncate text-sm text-ink-500">{value}</span>}
      <ChevronRight size={18} className="shrink-0 text-ink-400" />
    </>
  );
  const cls = cn(rowBase, "active:bg-ink-50 dark:active:bg-ink-800", disabled && "pointer-events-none opacity-50", className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {content}
    </button>
  );
}

/** Read-only — a value with no chevron, nothing happens on tap (e.g. the phone number). */
export function SettingsValueRow({ icon, label, description, value, className }: RowShellProps & { value?: string }) {
  return (
    <div className={cn(rowBase, className)}>
      {icon && <RowIcon icon={icon} />}
      <RowLabel label={label} description={description} />
      {value && <span className="max-w-[50%] shrink-0 truncate text-sm text-ink-500">{value}</span>}
    </div>
  );
}

export function SettingsToggleRow({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: RowShellProps & { checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <div className={cn(rowBase, className)}>
      {icon && <RowIcon icon={icon} />}
      <RowLabel label={label} description={description} />
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={label} />
    </div>
  );
}

export function SettingsDangerRow({
  label,
  onClick,
  loading,
  className,
}: {
  label: string;
  onClick: () => void;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex min-h-14 w-full items-center justify-center text-[15px] font-medium text-rose-600 disabled:opacity-50",
        interactiveTransition,
        focusRing,
        "active:bg-rose-500/5",
        className
      )}
    >
      {label}
    </button>
  );
}
