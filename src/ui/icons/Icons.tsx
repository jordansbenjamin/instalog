/* instalog design system — icons
   ----------------------------------------------------
   Custom inline SVG set, 16×16 viewBox, stroke="currentColor".
   Add icons here as needed; match the stroke style. Custom on
   purpose — do NOT swap in Lucide/Heroicons/etc.

   Pure data module (no component export) so Vite Fast Refresh
   boundaries stay clean.
*/
import type { SVGProps, ReactElement } from "react";

type IconRenderer = (props: SVGProps<SVGSVGElement>) => ReactElement;

export type IconName =
  | "logo"
  | "arrow"
  | "back"
  | "check"
  | "x"
  | "edit"
  | "trash"
  | "retry"
  | "download"
  | "settings"
  | "lock"
  | "external"
  | "close"
  | "bug"
  | "tickets"
  | "search"
  | "copy";

export const Icons: Record<IconName, IconRenderer> = {
  logo: (props) => (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <rect x="2.4" y="2.6" width="9.6" height="2.8" rx="1.4" fill="currentColor" />
      <rect x="2.4" y="6.6" width="6.2" height="2.8" rx="1.4" fill="var(--mark-accent, currentColor)" />
      <rect x="2.4" y="10.6" width="8.2" height="2.8" rx="1.4" fill="currentColor" />
    </svg>
  ),
  arrow: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  ),
  back: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 8H3M7 4L3 8l4 4" />
    </svg>
  ),
  check: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 8l3 3 7-7" />
    </svg>
  ),
  x: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  edit: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11.5 2.5l2 2M10 4L3 11v2h2l7-7-2-2z" />
    </svg>
  ),
  trash: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M4 4l1 9a1 1 0 001 1h4a1 1 0 001-1l1-9" />
    </svg>
  ),
  retry: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 3v4h-4M3 13v-4h4" />
      <path d="M12 6a5 5 0 00-9-1M4 10a5 5 0 009 1" />
    </svg>
  ),
  download: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 2v8M5 7l3 3 3-3M3 13h10" />
    </svg>
  ),
  settings: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.5v1.6M8 12.9v1.6M2.5 8H1M15 8h-1.5M3.7 3.7l1.1 1.1M11.2 11.2l1.1 1.1M3.7 12.3l1.1-1.1M11.2 4.8l1.1-1.1" />
    </svg>
  ),
  lock: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.25" y="7" width="9.5" height="6.5" rx="1.6" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
    </svg>
  ),
  external: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3H3.5A1.5 1.5 0 002 4.5v8A1.5 1.5 0 003.5 14h8a1.5 1.5 0 001.5-1.5V10" />
      <path d="M9.5 2H14v4.5M14 2L7.5 8.5" />
    </svg>
  ),
  close: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  bug: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="5.5" width="6" height="7" rx="3" />
      <path d="M8 5.5V4a2 2 0 10-.001 0M2.5 8H5M11 8h2.5M3 5l1.8 1.2M13 5l-1.8 1.2M3 11.5l1.9-1.1M13 11.5l-1.9-1.1" />
    </svg>
  ),
  tickets: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3.25h10v3.5H3zM3 9.25h10v3.5H3z" />
      <path d="M5.25 5h5.5M5.25 11h5.5" />
    </svg>
  ),
  search: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.25 10.25L14 14" />
    </svg>
  ),
  copy: (props) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5.25" y="5.25" width="7.25" height="7.25" rx="1.25" />
      <path d="M10.75 5.25v-1.5A1.25 1.25 0 009.5 2.5H3.75A1.25 1.25 0 002.5 3.75V9.5a1.25 1.25 0 001.25 1.25h1.5" />
    </svg>
  ),
};
