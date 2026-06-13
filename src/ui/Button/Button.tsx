import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";
import { Kbd } from "../Kbd/Kbd";
import styles from "./Button.module.css";

export type ButtonVariant = "ghost" | "primary" | "success" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  kbd?: ReactNode;
}

export function Button({
  variant = "ghost",
  children,
  icon,
  iconAfter,
  kbd,
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  const onDark = variant === "primary" || variant === "success";
  return (
    <button type={type} className={cx(styles.button, styles[variant], className)} {...rest}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
      {iconAfter && <span className={styles.icon}>{iconAfter}</span>}
      {kbd && <Kbd onDark={onDark}>{kbd}</Kbd>}
    </button>
  );
}
