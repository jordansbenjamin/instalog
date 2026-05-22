import AppLogo from "../atoms/AppLogo";
import StatusPill from "../atoms/StatusPill";
import styles from "./Header.module.css"

export default function Header() {
  return (
    <header className={styles.header}>
      <AppLogo />
      <StatusPill />
    </header>
  )
}
