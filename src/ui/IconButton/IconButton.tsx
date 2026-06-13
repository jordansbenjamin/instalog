import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";
import styles from "./IconButton.module.css";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  danger?: boolean;
}

// A bare, square icon-only button — modal close, and later row affordances
// (edit/delete). Distinct from Button: no label, no border, ghost by default.
export function IconButton({ icon, danger = false, type = "button", className, ...rest }: IconButtonProps) {
  return (
    <button type={type} className={cx(styles.iconButton, danger && styles.danger, className)} {...rest}>
      {icon}
    </button>
  );
}
