import { Brand } from "../../ui/Brand/Brand";
import { Pill } from "../../ui/Pill/Pill";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <Brand />
      <div className={styles.right}>
        <span className={styles.meta}>v0.5 · design spec</span>
        <Pill />
      </div>
    </header>
  );
}
