import type { ReactNode } from "react";
import { cx } from "../../ui/cx";
import { Button } from "../../ui/Button/Button";
import { Icons } from "../../ui/icons/Icons";
import styles from "./ConnectionGate.module.css";

interface ConnectionGateProps {
  locked: boolean;
  onConnect: () => void;
  children: ReactNode;
}

// Wraps the wizard. When locked, the children are dimmed/blurred and made
// non-interactive, and a lock card invites the user to connect. When unlocked,
// it's a transparent pass-through — no wrapper styling leaks onto the wizard.
export function ConnectionGate({ locked, onConnect, children }: ConnectionGateProps) {
  return (
    <div className={cx(styles.wrap, locked && styles.locked)}>
      <div className={styles.content}>{children}</div>

      {locked && (
        <div className={styles.gate}>
          <div className={styles.card}>
            <div className={styles.lock}>
              <Icons.lock width="22" height="22" />
            </div>
            <h3 className={styles.title}>Connect Jira to start</h3>
            <p className={styles.body}>
              instalog posts your worklogs directly to Jira. Connect your account to unlock the wizard.
            </p>
            <div className={styles.action}>
              <Button variant="primary" iconAfter={<Icons.arrow width="15" height="15" />} onClick={onConnect}>
                Connect Jira
              </Button>
            </div>
            <div className={styles.fine}>
              <Icons.lock width="12" height="12" /> uses Atlassian OAuth · or try the demo, no account needed
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
