// The account the SPA renders in its header pill. This mirrors the frontend's
// Account type (src/types/shared.ts) — it's the transport contract between them.
// Defined here independently so the server stays self-contained.
export interface Account {
  readonly name: string;
  readonly site: string;
  readonly initials: string;
  readonly isDemo: boolean;
}

/** First letter of the first and last word, uppercased. "Maddy Chen" → "MC". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "";
  }
  const first = words[0][0];
  const last = words[words.length - 1][0];
  return (words.length === 1 ? first : first + last).toUpperCase();
}

/** The host of a Jira site url; the raw value if it doesn't parse as a url. */
export function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function toAccount(name: string, site: string): Account {
  return { name, site, initials: initialsOf(name), isDemo: false };
}
