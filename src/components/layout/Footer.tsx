import { APP_VERSION } from "../../version";
import styles from "./Footer.module.css";

// A plain anchor, not client routing: privacy.html is a static file in public/,
// served outside the SPA, so /privacy.html is a real URL the server returns
// directly.
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <a className={styles.link} href="/privacy.html">
        Privacy Policy
      </a>
      <span className={styles.separator} aria-hidden="true">·</span>
      <span className={styles.version}>v{APP_VERSION}</span>
    </footer>
  );
}
