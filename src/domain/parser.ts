import type { HighlightToken, LineInfo, ParsedDate, ParsedEntry, ParseResult } from "../types/shared";

// ── Line-level predicates ─────────────────────────────────────────────────

function isValidDateFormat(line: string): boolean {
  // Only supports DD/M/YY for now.
  if (!/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(line)) return false;
  const [day, month] = line.split("/").map(Number);
  return day >= 1 && day <= 31 && month >= 1 && month <= 12;
}

function extractDateInfo(line: string): ParsedDate {
  const [day, month, year] = line.split("/").map(Number);
  return { day, month, year };
}

// A line that *starts* like a Jira key (e.g. ABC-123). Whether its time range is
// valid is decided separately — that's what distinguishes "ok" from "err".
function isTicketLine(line: string): boolean {
  return /^[A-Z][A-Z0-9]*-\d+/.test(line);
}

function isWrappedDescription(value: string): boolean {
  return value.length >= 2 && value.startsWith("(") && value.endsWith(")");
}

// Parse a single clock time ("8:40am", "9am", "12pm") to minutes since midnight,
// or null if it isn't a time we recognise. Strict on format so malformed times
// surface as per-line errors instead of silently becoming NaN.
function parseTimeToMinutes(token: string): number | null {
  const match = token.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3].toLowerCase();

  if (hour < 1 || hour > 12 || minute > 59) return null;
  if (meridiem === "am" && hour === 12) hour = 0; // 12am = midnight
  if (meridiem === "pm" && hour !== 12) hour += 12; // 1pm–11pm

  return hour * 60 + minute;
}

// ── Semantic parse of one ticket line ─────────────────────────────────────

type TicketParse =
  | { ok: true; entry: ParsedEntry }
  | { ok: false; message: string };

function parseTicketEntry(trimmed: string, lineNumber: number): TicketParse {
  const parts = trimmed.split(/\s+/);
  const ticketId = parts[0];
  const timePeriod = parts[1];

  if (!timePeriod) {
    return { ok: false, message: `${ticketId} is missing a time range — try ${ticketId} 9am-10am.` };
  }

  const segments = timePeriod.split("-");
  if (segments.length !== 2) {
    return { ok: false, message: `"${timePeriod}" isn't a valid range — use start-end, like 9am-10am.` };
  }

  const startMinutes = parseTimeToMinutes(segments[0]);
  const endMinutes = parseTimeToMinutes(segments[1]);
  if (startMinutes === null || endMinutes === null) {
    return { ok: false, message: `"${timePeriod}" has a time we couldn't read — try formats like 9am or 1:15pm.` };
  }
  if (endMinutes <= startMinutes) {
    return { ok: false, message: `End time must be after start time (got ${timePeriod}).` };
  }

  const descriptionRaw = parts.slice(2).join(" ");
  const description = isWrappedDescription(descriptionRaw) ? descriptionRaw.slice(1, -1).trim() : undefined;

  const base = { lineNumber, ticketId, startMinutes, endMinutes };
  const entry: ParsedEntry = description !== undefined ? { ...base, description } : base;
  return { ok: true, entry };
}

// ── Highlight tokenisation ────────────────────────────────────────────────
// Split a ticket line into coloured segments while preserving every character
// (including whitespace) so the overlay lines up exactly with the textarea.

function tokenizeTicketLine(raw: string, isOk: boolean): HighlightToken[] {
  const tokens: HighlightToken[] = [];

  const leadingWs = raw.match(/^\s*/)?.[0] ?? "";
  if (leadingWs) tokens.push({ text: leadingWs, type: "plain" });

  let rest = raw.slice(leadingWs.length);
  const ticket = rest.match(/^[A-Z][A-Z0-9]*-\d+/)?.[0] ?? "";
  if (ticket) {
    tokens.push({ text: ticket, type: "ticket" });
    rest = rest.slice(ticket.length);
  }

  // On an error line we don't try to colour the (broken) remainder — the gutter
  // marker and message carry the signal. Just keep the text intact.
  if (!isOk) {
    if (rest) tokens.push({ text: rest, type: "plain" });
    return tokens;
  }

  // ok line: a (comment) starts at the first "("; everything before it holds the
  // time range, padded by the original spaces.
  const parenIndex = rest.indexOf("(");
  const timePart = parenIndex >= 0 ? rest.slice(0, parenIndex) : rest;
  const commentPart = parenIndex >= 0 ? rest.slice(parenIndex) : "";

  const leadWs = timePart.match(/^\s*/)?.[0] ?? "";
  const trailWs = timePart.match(/\s*$/)?.[0] ?? "";
  const timeCore = timePart.slice(leadWs.length, timePart.length - trailWs.length);

  if (timeCore === "") {
    if (timePart) tokens.push({ text: timePart, type: "plain" });
  } else {
    if (leadWs) tokens.push({ text: leadWs, type: "plain" });
    tokens.push({ text: timeCore, type: "time" });
    if (trailWs) tokens.push({ text: trailWs, type: "plain" });
  }
  if (commentPart) tokens.push({ text: commentPart, type: "comment" });

  return tokens;
}

// ── Public API ────────────────────────────────────────────────────────────

export function parseTimesheet(input: string): ParseResult {
  // Split on raw newlines (no upfront trim) so gutter line numbers match exactly
  // what the user sees in the editor.
  const rawLines = input.split("\n");
  const lines: LineInfo[] = [];
  const entries: ParsedEntry[] = [];
  let date: ParsedDate | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const lineNumber = i + 1;
    const trimmed = raw.trim();

    if (trimmed === "") {
      lines.push({ kind: "blank", lineNumber, raw, tokens: [] });
      continue;
    }

    if (isValidDateFormat(trimmed)) {
      if (date === null) date = extractDateInfo(trimmed); // first date line wins
      lines.push({ kind: "date", lineNumber, raw, tokens: [{ text: raw, type: "date" }] });
      continue;
    }

    // A non-ticket, non-date line (e.g. "Lunch …") is intentionally skipped, not
    // an error — even if it happens to carry a valid time range.
    if (!isTicketLine(trimmed)) {
      lines.push({ kind: "skip", lineNumber, raw, tokens: [{ text: raw, type: "skip" }] });
      continue;
    }

    const parsed = parseTicketEntry(trimmed, lineNumber);
    if (!parsed.ok) {
      lines.push({ kind: "err", lineNumber, raw, tokens: tokenizeTicketLine(raw, false), errorMessage: parsed.message });
      continue;
    }
    entries.push(parsed.entry);
    lines.push({ kind: "ok", lineNumber, raw, tokens: tokenizeTicketLine(raw, true) });
  }

  // `lines` is always returned so the live editor can render as you type. The
  // failure messages below answer the separate "ready to advance?" question.
  if (!input.trim()) {
    return { success: false, errorMessage: "Input is empty, please add a timesheet.", lines };
  }
  if (date === null) {
    return { success: false, errorMessage: "No date found, please add a date", lines };
  }
  if (entries.length === 0) {
    return { success: false, errorMessage: "No valid entries yet — add a line like ABC-123 9am-10am.", lines };
  }
  return { success: true, date, entries, lines };
}
