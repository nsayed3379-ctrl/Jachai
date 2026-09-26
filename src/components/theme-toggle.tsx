"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { IconButton } from "./ui/icon-button";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <IconButton
      // unstyled, not ghost — every call site passes its own color className (e.g. white
      // icon on the transparent hero header vs. ink on the solid header), and ghost's own
      // unconditional text/hover classes would sit in the DOM alongside that override with
      // no reliable winner (cn() has no tailwind-merge — see lib/utils.ts#focusRing).
      variant="unstyled"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
    >
      {isDark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
    </IconButton>
  );
}
