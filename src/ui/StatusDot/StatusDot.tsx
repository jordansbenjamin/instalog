import { cx } from "../cx";
import styles from "./StatusDot.module.css";

export type DotVariant = "success" | "connecting" | "neutral" | "warn" | "error";

export function StatusDot({ variant = "success" }: { variant?: DotVariant }) {
  return <span className={cx(styles.dot, variant !== "success" && styles[variant])} />;
}
