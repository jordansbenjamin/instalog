import styles from "./Spinner.module.css";

// Small inline activity indicator. `size` sets the diameter (px); the ring
// thickness stays constant in CSS. The connect modal renders a larger one.
export function Spinner({ size = 14 }: { size?: number }) {
  return <span className={styles.spinner} style={{ width: size, height: size }} />;
}
