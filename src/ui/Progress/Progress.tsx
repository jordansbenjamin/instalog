import styles from "./Progress.module.css";

// A determinate progress bar with an ambient shimmer sweep. `value` is 0–100.
export function Progress({ value }: { value: number }) {
  return (
    <div className={styles.progress}>
      <div className={styles.fill} style={{ width: `${value}%` }} />
    </div>
  );
}
