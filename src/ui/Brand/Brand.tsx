import { cx } from "../cx";
import { Icons } from "../icons/Icons";
import styles from "./Brand.module.css";

interface BrandProps {
  size?: "sm" | "md";
  onAccent?: boolean;
}

export function Brand({ size = "md", onAccent = false }: BrandProps) {
  const px = size === "sm" ? 22 : 26;
  return (
    <span className={styles.brand}>
      <span className={cx(styles.mark, onAccent && styles.onAccent)} style={{ width: px, height: px }}>
        <Icons.logo />
      </span>
      <span>instalog</span>
    </span>
  );
}
