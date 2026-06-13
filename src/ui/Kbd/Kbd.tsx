import type { ReactNode } from "react";
import { cx } from "../cx";
import styles from "./Kbd.module.css";

interface KbdProps {
  children: ReactNode;
  onDark?: boolean;
}

export function Kbd({ children, onDark = false }: KbdProps) {
  const keys = Array.isArray(children) ? children : [children];
  return (
    <span className={styles.kbd}>
      {keys.map((key, index) => (
        <span key={index} className={cx(styles.key, onDark && styles.onDark)}>
          {key}
        </span>
      ))}
    </span>
  );
}
