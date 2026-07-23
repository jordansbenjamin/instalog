import type { TicketReference } from "../../domain/ticketReference";
import { Button } from "../../ui/Button/Button";
import { Icons } from "../../ui/icons/Icons";
import styles from "./TicketReferenceList.module.css";

interface TicketReferenceListProps {
  tickets: readonly TicketReference[];
  hasSavedTickets: boolean;
  onCopy(ticketId: string): void;
  onAdd(): void;
  onImport(): void;
}

export function TicketReferenceList({
  tickets,
  hasSavedTickets,
  onCopy,
  onAdd,
  onImport,
}: TicketReferenceListProps) {
  if (!hasSavedTickets) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyMark} aria-hidden="true">
          <Icons.tickets width="22" height="22" />
        </div>
        <h3 className={styles.emptyTitle}>No common tickets yet.</h3>
        <p className={styles.emptyBody}>
          Add one or paste a list to build your reference.
        </p>
        <div className={styles.emptyActions}>
          <Button variant="primary" onClick={onAdd}>
            Add ticket
          </Button>
          <Button onClick={onImport}>Import list</Button>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className={styles.noResults}>
        <Icons.search width="18" height="18" aria-hidden="true" />
        <p>No tickets match that search.</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {tickets.map((ticket) => (
        <li key={ticket.ticketId}>
          <button
            type="button"
            className={styles.ticket}
            aria-label={`Copy ${ticket.ticketId} — ${ticket.label}`}
            onClick={() => onCopy(ticket.ticketId)}
          >
            <span className={styles.ticketText}>
              <code className={styles.ticketId}>{ticket.ticketId}</code>
              <span className={styles.ticketLabel}>{ticket.label}</span>
            </span>
            <Icons.copy
              className={styles.copyIcon}
              width="15"
              height="15"
              aria-hidden="true"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
