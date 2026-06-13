import type { ReactNode } from "react";
import { cx } from "../cx";
import { StatusDot } from "../StatusDot/StatusDot";
import type { DotVariant } from "../StatusDot/StatusDot";
import styles from "./Pill.module.css";

interface PillProps {
  children?: ReactNode;
  dot?: DotVariant;
  onClick?: () => void;
  title?: string;
}

export function Pill({ children = "jira · connected", dot = "success", onClick, title }: PillProps) {
  if (onClick) {
    return (
      <button type="button" className={cx(styles.pill, styles.clickable)} onClick={onClick} title={title}>
        <StatusDot variant={dot} />
        <span>{children}</span>
      </button>
    );
  }
  return (
    <span className={styles.pill}>
      <StatusDot variant={dot} />
      <span>{children}</span>
    </span>
  );
}
