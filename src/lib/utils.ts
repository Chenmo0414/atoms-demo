import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(
  date: string | Date,
  locale?: { justNow: string; minutesAgo: (m: number) => string; hoursAgo: (h: number) => string; daysAgo: (d: number) => string }
): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (locale) {
    if (seconds < 60) return locale.justNow;
    if (minutes < 60) return locale.minutesAgo(minutes);
    if (hours < 24) return locale.hoursAgo(hours);
    if (days < 7) return locale.daysAgo(days);
    return d.toLocaleDateString();
  }

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}
