import type { FallbackProps } from "react-error-boundary";
import { clearState } from "../state/persistence";
import styles from "./ErrorFallback.module.css";

// Self-contained on purpose — no design-system imports — so it renders even if
// something in the component layer is what broke. Offers a plain reload and a
// "reset saved data" path in case corrupt persisted state is the cause.
export function ErrorFallback({ error }: FallbackProps) {
  const reload = () => window.location.reload();
  const resetData = () => {
    clearState();
    window.location.reload();
  };

  const message = error instanceof Error ? error.message : String(error);

  return (
    <div className={styles.wrap} role="alert">
      <div className={styles.card}>
        <div className={styles.icon}>!</div>
        <h3 className={styles.title}>Something went wrong</h3>
        <p className={styles.body}>
          instalog hit an unexpected error and stopped. Your Jira connection and saved work are still on this device.
        </p>
        {message && <pre className={styles.detail}>{message}</pre>}
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={reload}>
            Reload instalog
          </button>
          <button type="button" className={styles.secondary} onClick={resetData}>
            Reset saved data
          </button>
        </div>
      </div>
    </div>
  );
}
