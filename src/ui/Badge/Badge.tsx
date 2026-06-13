import type { ReactNode } from "react";
import { cx } from "../cx";
import styles from "./Badge.module.css";

export type BadgeKind = "ok" | "err" | "warn";

// A small status pill — the ✓/× code chip on result rows. Presentational; the
// caller supplies the glyph + label as children.
export function Badge({ kind = "ok", children }: { kind?: BadgeKind; children: ReactNode }) {
  return <span className={cx(styles.badge, styles[kind])}>{children}</span>;
}
