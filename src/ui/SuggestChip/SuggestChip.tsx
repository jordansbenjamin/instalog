import type { ReactNode } from "react";
import styles from "./SuggestChip.module.css";

interface SuggestChipProps {
  children: ReactNode;
  onApply?: () => void;
  applyLabel?: string;
}

// A soft warn pill with an inline "apply" action — used for the paste step's
// smart fix suggestion. Presentational only; the heuristic lives in the caller.
export function SuggestChip({ children, onApply, applyLabel = "Apply fix" }: SuggestChipProps) {
  return (
    <div className={styles.suggest}>
      <span className={styles.icon} aria-hidden="true">⚠</span>
      <span className={styles.message}>{children}</span>
      {onApply && (
        <button type="button" className={styles.apply} onClick={onApply}>
          {applyLabel}
        </button>
      )}
    </div>
  );
}
