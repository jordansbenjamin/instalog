import type { UseTicketReferencesResult } from "../../hooks/useTicketReferences";
import { Icons } from "../../ui/icons/Icons";
import { TicketReferenceList } from "./TicketReferenceList";
import { TicketReferenceManager } from "./TicketReferenceManager";
import styles from "./TicketReferencePanel.module.css";

interface TicketReferencePanelProps {
  references: UseTicketReferencesResult;
  headingId?: string;
}

export function TicketReferencePanel({
  references,
  headingId = "ticket-reference-heading",
}: TicketReferencePanelProps) {
  if (references.mode !== "reference") {
    return (
      <aside className={styles.panel} aria-labelledby={headingId}>
        <TicketReferenceManager
          references={references}
          headingId={headingId}
        />
      </aside>
    );
  }

  const handleAdd = (): void => {
    references.startManaging();
    references.addDraftTicket();
  };

  const handleImport = (): void => {
    references.startManaging();
    references.startImport();
  };

  const visibleCount = references.visibleTickets.length;
  const totalCount = references.tickets.length;
  const countLabel =
    references.search.trim().length > 0
      ? `${visibleCount} of ${totalCount} tickets`
      : `${totalCount} ${totalCount === 1 ? "ticket" : "tickets"}`;

  return (
    <aside className={styles.panel} aria-labelledby={headingId}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Reference</span>
        <h2 id={headingId} className={styles.heading}>Common tickets</h2>
        <p className={styles.description}>
          Keep frequently used IDs close. Select a ticket to copy it.
        </p>
      </div>

      {references.warning && (
        <p className={styles.warning} role="alert">
          {references.warning}
        </p>
      )}

      {references.tickets.length > 0 && (
        <label className={styles.search}>
          <span className={styles.searchLabel}>Search tickets</span>
          <span className={styles.searchField}>
            <Icons.search width="14" height="14" aria-hidden="true" />
            <input
              type="search"
              value={references.search}
              onChange={(event) => references.setSearch(event.target.value)}
              placeholder="ID or label"
            />
          </span>
        </label>
      )}

      <div className={styles.listRegion}>
        <TicketReferenceList
          tickets={references.visibleTickets}
          hasSavedTickets={references.tickets.length > 0}
          onCopy={(ticketId) => {
            void references.copyTicketId(ticketId);
          }}
          onAdd={handleAdd}
          onImport={handleImport}
        />
      </div>

      <div className={styles.statusRegion} aria-live="polite" role="status">
        {references.message}
      </div>

      <div className={styles.footer}>
        <span className={styles.count}>{countLabel}</span>
        <button
          type="button"
          className={styles.manage}
          onClick={references.startManaging}
        >
          <Icons.settings width="14" height="14" aria-hidden="true" />
          Manage list
        </button>
      </div>
    </aside>
  );
}
