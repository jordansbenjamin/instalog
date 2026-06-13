import type { ReactNode } from "react";
import styles from "./Frame.module.css";

interface FrameProps {
  children: ReactNode;
  stepper?: ReactNode;
}

export function Frame({ children, stepper }: FrameProps) {
  return (
    <div className={styles.frame}>
      {stepper}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
