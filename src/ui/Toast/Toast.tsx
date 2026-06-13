import { type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icons } from "../icons/Icons";
import styles from "./Toast.module.css";

interface ToastProps {
  children: ReactNode;
  // Optional inline action (e.g. "Undo" in Phase 4). Rendered before the
  // dismiss affordance.
  action?: ReactNode;
  onDismiss?: () => void;
}

// Bottom-centre, ink-on-paper toast. Portaled so it floats above everything
// regardless of where it's mounted in the tree.
export function Toast({ children, action, onDismiss }: ToastProps) {
  return createPortal(
    <div className={styles.toast} role="status">
      <span className={styles.body}>{children}</span>
      {action}
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <Icons.x width="12" height="12" />
        </button>
      )}
    </div>,
    document.body
  );
}
