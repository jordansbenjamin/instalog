import { useEffect, useRef, useState } from "react";
import type { TicketReference } from "../../domain/ticketReference";
import { Button } from "../../ui/Button/Button";
import { Icons } from "../../ui/icons/Icons";
import styles from "./TicketReferenceList.module.css";

interface TicketReferenceListProps {
  tickets: readonly TicketReference[];
  hasSavedTickets: boolean;
  onCopy(ticketId: string): Promise<boolean>;
  onAdd(): void;
  onImport(): void;
}

// How long a row shows its "Copied" confirmation before returning to rest.
const COPY_FEEDBACK_MS = 1400;

export function TicketReferenceList({
  tickets,
  hasSavedTickets,
  onCopy,
  onAdd,
  onImport,
}: TicketReferenceListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const resetTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeout.current !== null) {
        window.clearTimeout(resetTimeout.current);
      }
    };
  }, []);

  const handleCopy = async (ticketId: string): Promise<void> => {
    const didCopy = await onCopy(ticketId);
    if (!didCopy) {
      return;
    }

    setCopiedId(ticketId);
    if (resetTimeout.current !== null) {
      window.clearTimeout(resetTimeout.current);
    }
    resetTimeout.current = window.setTimeout(() => {
      setCopiedId(null);
    }, COPY_FEEDBACK_MS);
  };

  if (!hasSavedTickets) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyMark} aria-hidden="true">
          <Icons.tickets width="20" height="20" />
        </div>
        <h3 className={styles.emptyTitle}>No common tickets yet</h3>
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
        <Icons.search width="16" height="16" aria-hidden="true" />
        <p>No tickets match that search.</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {tickets.map((ticket) => {
        const isCopied = copiedId === ticket.ticketId;
        return (
          <li key={ticket.ticketId}>
            <button
              type="button"
              className={styles.ticket}
              data-copied={isCopied ? "" : undefined}
              aria-label={`Copy ${ticket.ticketId} — ${ticket.label}`}
              onClick={() => {
                void handleCopy(ticket.ticketId);
              }}
            >
              <span className={styles.body}>
                <code className={styles.ticketId}>{ticket.ticketId}</code>
                <span className={styles.ticketLabel}>{ticket.label}</span>
              </span>
              <span className={styles.action} aria-hidden="true">
                {isCopied ? (
                  <Icons.check width="14" height="14" />
                ) : (
                  <Icons.copy width="14" height="14" />
                )}
                <span className={styles.actionText}>
                  {isCopied ? "Copied" : "Copy"}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
