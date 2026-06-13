import { Children, type ReactNode } from "react";
import { cx } from "../cx";
import styles from "./Metric.module.css";

// The bordered metric strip. Columns are sized evenly from the child count, so
// a 3-up and a 4-up strip both lay out correctly with no extra props.
export function Metrics({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <div className={styles.metrics} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items}
    </div>
  );
}

type MetricTone = "accent" | "success" | "error";

interface MetricProps {
  label: string;
  value: ReactNode;
  // A trailing unit. A string is rendered small + muted; a node is rendered
  // as-is (for composite units like "h 09m").
  unit?: ReactNode;
  tone?: MetricTone;
  icon?: ReactNode;
}

export function Metric({ label, value, unit, tone, icon }: MetricProps) {
  return (
    <div className={cx(styles.metric, tone && styles[tone])}>
      <div className={styles.label}>
        {icon}
        {label}
      </div>
      <div className={styles.value}>
        {value}
        {unit != null && (typeof unit === "string" ? <span className={styles.u}>{unit}</span> : unit)}
      </div>
    </div>
  );
}
