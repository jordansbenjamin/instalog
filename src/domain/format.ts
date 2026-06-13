import type { ParsedDate } from "../types/shared";

// Presentation helpers for the parsed domain values. Pure and testable — the UI
// (Paste footer, Preview metrics + rows) renders these, never raw minutes.

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export interface FormattedDate {
  weekday: string; // "Mon"
  day: number;     // 16
  month: string;   // "Mar"
  year: number;    // 2026
}

// ParsedDate carries a 2-digit year (e.g. 26); we assume the 2000s. Returns null
// for a missing date so callers can render an em-dash placeholder.
export function formatDate(date: ParsedDate | null): FormattedDate | null {
  if (!date) return null;
  const fullYear = 2000 + date.year;
  const jsDate = new Date(fullYear, date.month - 1, date.day);
  return {
    weekday: WEEKDAYS[jsDate.getDay()],
    day: date.day,
    month: MONTHS[date.month - 1],
    year: fullYear,
  };
}

// Minutes since midnight → 12-hour clock, e.g. 520 → "8:40 am", 720 → "12:00 pm".
export function formatTime(minutes: number): string {
  const minuteOfDay = ((minutes % 1440) + 1440) % 1440; // wrap into a single day
  const hours24 = Math.floor(minuteOfDay / 60);
  const mins = minuteOfDay % 60;
  const meridiem = hours24 < 12 ? "am" : "pm";
  const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hour12}:${mins.toString().padStart(2, "0")} ${meridiem}`;
}

// A span in minutes → "0h 38m", 128 → "2h 8m".
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, minutes);
  return `${Math.floor(safe / 60)}h ${safe % 60}m`;
}
