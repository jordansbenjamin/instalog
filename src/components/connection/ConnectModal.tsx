import { cx } from "../../ui/cx";
import { Modal } from "../../ui/Modal/Modal";
import { Button } from "../../ui/Button/Button";
import { IconButton } from "../../ui/IconButton/IconButton";
import { Spinner } from "../../ui/Spinner/Spinner";
import { Icons } from "../../ui/icons/Icons";
import type { ConnectionState } from "../../types/shared";
import styles from "./ConnectModal.module.css";

interface ConnectModalProps {
  open: boolean;
  connection: ConnectionState;
  onConnect: () => void;
  onDemo: () => void;
  onDisconnect: () => void;
  onCancel: () => void;
  onClose: () => void;
}

// The Jira connection dialog. It's a pure view of `connection.status`: the
// reducer owns the state, this just renders one of three faces. The connecting
// face is non-dismissable (Modal.dismissable=false) — Cancel is the only exit.
export function ConnectModal({
  open,
  connection,
  onConnect,
  onDemo,
  onDisconnect,
  onCancel,
  onClose,
}: ConnectModalProps) {
  const { status, account } = connection;
  const dismissable = status !== "connecting";

  return (
    <Modal open={open} onClose={onClose} dismissable={dismissable}>
      {dismissable && (
        <div className={styles.close}>
          <IconButton icon={<Icons.close width="15" height="15" />} onClick={onClose} title="Close" />
        </div>
      )}

      {status === "disconnected" && (
        <div>
          <div className={styles.icon}>
            <Icons.lock width="20" height="20" />
          </div>
          <h3 className={styles.title}>Connect to Jira</h3>
          <p className={styles.text}>
            instalog posts worklogs straight to your Jira account. Connect with Atlassian to unlock the wizard.
          </p>
          <div className={styles.actions}>
            <Button variant="primary" iconAfter={<Icons.external width="15" height="15" />} onClick={onConnect}>
              Continue with Atlassian
            </Button>
            <div className={styles.or}>
              <span>or</span>
            </div>
            <Button onClick={onDemo}>Explore the demo (no account needed)</Button>
          </div>
          <div className={styles.fine}>
            You'll authorize instalog on Atlassian, then choose which site to use. We never see your password.
          </div>
        </div>
      )}

      {status === "connecting" && (
        <div className={styles.wait}>
          <Spinner size={26} />
          <div>
            <h3 className={styles.title}>Waiting for Atlassian…</h3>
            <p className={styles.text}>
              A secure Atlassian window has opened. Approve access for instalog to continue.
            </p>
          </div>
          <Button onClick={onCancel}>Cancel</Button>
        </div>
      )}

      {status === "connected" && account && (
        <div>
          <div className={styles.head}>
            <div className={cx(styles.icon, styles.iconSuccess)}>
              <Icons.check width="20" height="20" />
            </div>
            {account.isDemo && <span className={styles.demoBadge}>demo mode</span>}
          </div>
          <h3 className={styles.title}>{account.isDemo ? "Demo ready" : "Connected"}</h3>
          <p className={styles.text}>
            {account.isDemo
              ? "Explore instalog with sample data, worklogs are simulated, nothing is sent to Jira."
              : "instalog can now log time to your Jira worklogs."}
          </p>
          <div className={cx(styles.account, account.isDemo && styles.accountDemo)}>
            <span className={styles.avatar}>{account.initials}</span>
            <div className={styles.accountText}>
              <span className={styles.accountName}>{account.name}</span>
              <span className={styles.accountSite}>{account.site}</span>
            </div>
          </div>
          <div className={cx(styles.actions, styles.actionsRow)}>
            <Button variant="danger" onClick={onDisconnect}>
              {account.isDemo ? "Exit demo" : "Disconnect"}
            </Button>
            <Button variant="primary" iconAfter={<Icons.arrow width="15" height="15" />} onClick={onClose}>
              Start logging
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
