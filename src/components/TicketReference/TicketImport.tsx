import type {
  TicketImportCounts,
  TicketImportStatus,
} from "../../domain/ticketReference";
import type { UseTicketReferencesResult } from "../../hooks/useTicketReferences";
import { Button } from "../../ui/Button/Button";
import { Icons } from "../../ui/icons/Icons";
import styles from "./TicketImport.module.css";

interface TicketImportProps {
  references: UseTicketReferencesResult;
  headingId?: string;
}

const STATUS_LABELS: Record<TicketImportStatus, string> = {
  new: "New",
  update: "Update",
  unchanged: "Unchanged",
  invalid: "Invalid",
  conflict: "Conflict",
};

function buildImportActionLabel(counts: TicketImportCounts): string {
  if (counts.conflict > 0) {
    return "Resolve conflicts to continue";
  }

  if (counts.new > 0 && counts.update > 0) {
    return `Import ${counts.new} new and update ${counts.update}`;
  }

  if (counts.new > 0) {
    return `Import ${counts.new} new`;
  }

  if (counts.update > 0) {
    return `Update ${counts.update} ${
      counts.update === 1 ? "ticket" : "tickets"
    }`;
  }

  return "Nothing to import";
}

function formatSummary(counts: TicketImportCounts): string {
  const parts = [
    counts.new > 0 ? `${counts.new} new` : null,
    counts.update > 0 ? `${counts.update} update` : null,
    counts.unchanged > 0 ? `${counts.unchanged} unchanged` : null,
    counts.invalid > 0 ? `${counts.invalid} invalid` : null,
    counts.conflict > 0 ? `${counts.conflict} conflict` : null,
  ].filter((part): part is string => part !== null);

  return parts.length > 0 ? parts.join(" · ") : "No rows found";
}

export function TicketImport({
  references,
  headingId = "ticket-import-heading",
}: TicketImportProps) {
  const preview = references.importPreview;
  const actionableCount = preview
    ? preview.counts.new + preview.counts.update
    : 0;
  const confirmationDisabled =
    preview === null ||
    preview.counts.conflict > 0 ||
    actionableCount === 0;

  return (
    <div className={styles.importer}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Paste import</span>
        <h2 id={headingId} className={styles.heading}>Import tickets</h2>
        <p className={styles.description}>
          Paste two columns: a ticket ID and its short label.
        </p>
      </div>

      <label className={styles.pasteField}>
        <span>Ticket list</span>
        <textarea
          value={references.importText}
          rows={7}
          placeholder={"DEMO-42\tDaily planning\nTEAM-7,Team meeting"}
          onChange={(event) => references.setImportText(event.target.value)}
        />
      </label>

      <p className={styles.hint}>
        Spreadsheet rows, two-column CSV, and Markdown Jira links are accepted.
        URLs are ignored.
      </p>

      <div className={styles.previewAction}>
        <Button
          type="button"
          icon={<Icons.search width="14" height="14" />}
          disabled={references.importText.trim().length === 0}
          onClick={references.previewImport}
        >
          {preview ? "Preview again" : "Preview import"}
        </Button>
      </div>

      {preview && (
        <div className={styles.preview}>
          <div className={styles.summary}>
            <span>Preview</span>
            <strong>{formatSummary(preview.counts)}</strong>
          </div>

          <ol className={styles.rows}>
            {preview.rows.map((row) => (
              <li
                key={`${row.rowNumber}-${row.raw}`}
                className={styles.previewRow}
              >
                <div className={styles.rowHeading}>
                  <span className={styles.rowNumber}>Row {row.rowNumber}</span>
                  <span className={`${styles.status} ${styles[row.status]}`}>
                    {STATUS_LABELS[row.status]}
                  </span>
                </div>
                {row.ticket ? (
                  <div className={styles.ticket}>
                    <code>{row.ticket.ticketId}</code>
                    <span>{row.ticket.label}</span>
                  </div>
                ) : (
                  <code className={styles.raw}>{row.raw}</code>
                )}
                {row.message && (
                  <p className={styles.message}>{row.message}</p>
                )}
              </li>
            ))}
          </ol>

          {preview.counts.conflict > 0 && (
            <p className={styles.conflictNotice}>
              Resolve conflicting rows in the paste, then preview again.
            </p>
          )}
        </div>
      )}

      <div className={styles.footer}>
        <Button type="button" onClick={references.cancelImport}>
          Cancel import
        </Button>
        {preview && (
          <Button
            type="button"
            variant="primary"
            disabled={confirmationDisabled}
            onClick={references.applyImport}
          >
            {buildImportActionLabel(preview.counts)}
          </Button>
        )}
      </div>
    </div>
  );
}
