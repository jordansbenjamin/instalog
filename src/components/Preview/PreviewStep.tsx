import { useEffect, useState } from "react";
import type { ParsedEntry, StepProps } from "../../types/shared";
import { formatDate } from "../../domain/format";
import { Button } from "../../ui/Button/Button";
import { Metric, Metrics } from "../../ui/Metric/Metric";
import { Toast } from "../../ui/Toast/Toast";
import { Icons } from "../../ui/icons/Icons";
import { EntryRow } from "./EntryRow";
import styles from "./PreviewStep.module.css";

const UNDO_MS = 5000;

interface PendingUndo {
  index: number;
  entry: ParsedEntry;
}

// The active inline edit: which row (by stable lineNumber) and its draft note.
interface EditSession {
  lineNumber: number;
  draft: string;
}

export default function PreviewStep({ state, dispatch }: StepProps) {
  const [edit, setEdit] = useState<EditSession | null>(null);
  const [undo, setUndo] = useState<PendingUndo | null>(null);

  const result = state.parsedResult;
  const entries = result && result.success ? result.entries : [];
  const date = result && result.success ? result.date : null;

  // The undo toast auto-dismisses after 5s; a fresh delete replaces the timer.
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  // ⌘↵ submits — but only when not mid-edit, so it never hijacks the note input.
  useEffect(() => {
    if (edit !== null) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && entries.length > 0) {
        event.preventDefault();
        dispatch({ type: "SUBMIT_STARTED" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [edit, entries.length, dispatch]);

  // Defensive: Preview is only reachable via a successful parse, but narrow for TS.
  if (!result || !result.success) return null;

  const totalMinutes = entries.reduce((sum, entry) => sum + (entry.endMinutes - entry.startMinutes), 0);
  const uniqueTickets = new Set(entries.map((entry) => entry.ticketId)).size;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  const formattedDate = formatDate(date);

  const startEdit = (entry: ParsedEntry) => setEdit({ lineNumber: entry.lineNumber, draft: entry.description ?? "" });
  const changeDraft = (draft: string) => setEdit((current) => (current ? { ...current, draft } : current));
  const cancelEdit = () => setEdit(null);
  const commitEdit = (index: number) => {
    if (!edit) return;
    const description = edit.draft.trim();
    dispatch({ type: "EDIT_ENTRY", index, patch: { description: description || undefined } });
    setEdit(null);
  };

  const deleteEntry = (index: number) => {
    setUndo({ index, entry: entries[index] });
    dispatch({ type: "DELETE_ENTRY", index });
  };

  const restoreEntry = () => {
    if (!undo) return;
    dispatch({ type: "RESTORE_ENTRY", index: undo.index, entry: undo.entry });
    setUndo(null);
  };

  return (
    <div className={styles.step}>
      <Metrics>
        <Metric label="Entries" value={entries.length} tone="accent" />
        <Metric
          label="Total logged"
          tone="accent"
          value={
            <>
              {hours}
              <span className={styles.unit}>h</span> {minutes}
              <span className={styles.unit}>m</span>
            </>
          }
        />
        <Metric label="Unique tickets" value={uniqueTickets} />
        <Metric
          label="Day"
          value={formattedDate ? formattedDate.weekday : "—"}
          unit={formattedDate ? `${formattedDate.day} ${formattedDate.month}` : undefined}
        />
      </Metrics>

      <div className={styles.list}>
        <div className={styles.listHead}>
          <span>Parsed entries</span>
          <span>
            Click to edit · <span className={styles.kbdInline}>⌫</span> to delete
          </span>
        </div>
        <div className={styles.listBody}>
          {entries.map((entry, index) => {
            const editing = edit?.lineNumber === entry.lineNumber;
            return (
              <EntryRow
                key={entry.lineNumber}
                entry={entry}
                editing={editing}
                draft={editing ? edit.draft : ""}
                onStartEdit={() => startEdit(entry)}
                onDraftChange={changeDraft}
                onCommit={() => commitEdit(index)}
                onCancel={cancelEdit}
                onDelete={() => deleteEntry(index)}
              />
            );
          })}
        </div>
        <div className={styles.listFoot}>
          <span>
            <strong>{hours}h {minutes}m</strong> across {entries.length} entries · {uniqueTickets} tickets
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.actionsGroup}>
          <Button icon={<Icons.back width="14" height="14" />} onClick={() => dispatch({ type: "BACK" })}>
            Back to paste
          </Button>
        </div>
        <div className={styles.actionsGroup}>
          <Button
            variant="primary"
            iconAfter={<Icons.arrow width="15" height="15" />}
            kbd={["⌘", "↵"]}
            disabled={entries.length === 0}
            onClick={() => dispatch({ type: "SUBMIT_STARTED" })}
          >
            Submit {entries.length} to Jira
          </Button>
        </div>
      </div>

      {undo && (
        <Toast
          action={
            <button type="button" className={styles.undoButton} onClick={restoreEntry}>
              Undo
            </button>
          }
          onDismiss={() => setUndo(null)}
        >
          <span>
            <strong>{undo.entry.ticketId}</strong> removed
          </span>
        </Toast>
      )}
    </div>
  );
}
