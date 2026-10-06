import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatISTTime(isoString?: string | null): string {
  if (!isoString) return "N/A";
  try {
    const raw = isoString.trim();
    let parseable = raw;
    if (parseable.endsWith("IST")) {
      parseable = parseable.replace(/\s*IST$/, " +05:30");
    }
    const date = new Date(parseable);
    if (!isNaN(date.getTime())) {
      const timeStr = date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      if (timeStr && timeStr.toLowerCase() !== "invalid date") {
        return timeStr;
      }
    }
    const match = raw.match(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/);
    if (match) return match[0];
    return raw;
  } catch {
    return isoString;
  }
}

export function formatScheduleTime(timeStr?: string | null): string {
  if (!timeStr) return "";
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}:\d{2}):\d{2}$/);
  if (match) return match[1];
  return trimmed;
}

export function formatDate(isoString?: string | null): string {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function resolveImageUrl(url?: string | null): string {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  let apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".onrender.com")) {
      apiBase = "https://kangayath-api.onrender.com";
    } else if (host.includes("kangayath.site")) {
      apiBase = "https://api.kangayath.site";
    } else if (host.includes("kangayath.in")) {
      apiBase = "https://api.kangayath.in";
    }
  }
  if (url.startsWith("/media/")) {
    return `${apiBase.replace(/\/+$/, "")}${url}`;
  }
  return url;
}

