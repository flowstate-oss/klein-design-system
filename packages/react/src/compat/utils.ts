import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
/** Internal utility; never an application dependency. */
export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}

export function getInitials(name: string): string {
  if (!name) return "";

  // Split on spaces, dots, and underscores to handle email-style names
  return name
    .split(/[\s._]+/)
    .filter((part) => part.length > 0)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Deterministically generates a chart color variable based on a string (name).
 * Used for consistent avatar backgrounds.
 *
 * @param name - The input string to hash
 * @returns A CSS variable string (e.g., "var(--color-chart-1)")
 */
export function getUserAvatarColor(name: string): string {
  if (!name) return "var(--color-klein-600)";

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const avatarColors = [
    "var(--color-klein-600)",
    "var(--color-klein-700)",
    "var(--color-klein-800)",
    "var(--color-good)",
    "var(--color-watch)",
    "var(--color-bad)",
    "var(--color-gray-600)",
    "var(--color-gray-700)",
  ];
  return avatarColors[Math.abs(hash) % avatarColors.length];
}
