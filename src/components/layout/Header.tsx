import { Brand } from "../../ui/Brand/Brand";
import { Pill } from "../../ui/Pill/Pill";
import type { DotVariant } from "../../ui/StatusDot/StatusDot";
import type { ConnectionState } from "../../types/shared";
import styles from "./Header.module.css";

// Maps the connection state machine to the pill's dot + label. Demo connected
// is deliberately shown with the amber "connecting" dot (a gentle pulse) and a
// "simulated" label, so a demo session never visually masquerades as a real
// green-ping Jira connection.
function pillFromConnection({ status, account }: ConnectionState): { dot: DotVariant; label: string } {
  if (status === "connected" && account?.isDemo) {
    return { dot: "connecting", label: "demo · simulated" };
  }
  switch (status) {
    case "connected":
      return { dot: "success", label: "jira · connected" };
    case "connecting":
      return { dot: "connecting", label: "jira · connecting…" };
    case "disconnected":
      return { dot: "neutral", label: "jira · not connected" };
  }
}

interface HeaderProps {
  connection: ConnectionState;
  onManageConnection: () => void;
}

export default function Header({ connection, onManageConnection }: HeaderProps) {
  const pill = pillFromConnection(connection);
  return (
    <header className={styles.header}>
      <Brand />
      <div className={styles.right}>
        <span className={styles.meta}>v1.4.0 · release spec</span>
        <Pill dot={pill.dot} onClick={onManageConnection} title="Manage Jira connection">
          {pill.label}
        </Pill>
      </div>
    </header>
  );
}
