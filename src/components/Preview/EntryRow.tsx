import { type KeyboardEvent, type MouseEvent } from "react";
import type { ParsedEntry } from "../../types/shared";
import { formatTime, formatDuration } from "../../domain/format";
import { cx } from "../../ui/cx";
import { IconButton } from "../../ui/IconButton/IconButton";
import { Icons } from "../../ui/icons/Icons";
import styles from "./EntryRow.module.css";

interface EntryRowProps {
  entry: ParsedEntry;
  editing: boolean;
  // Controlled draft note (owned by PreviewStep's edit session) — present only
  // while editing. Keeping it in the parent means this row holds no local state,
  // so toggling edit swaps the note cell without remounting (and re-animating).
  draft: string;
  onStartEdit: () => void;
  onDraftChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function EntryRow({
  entry,
  editing,
  draft,
  onStartEdit,
  onDraftChange,
  onCommit,
  onCancel,
  onDelete,
}: EntryRowProps) {
  const duration = formatDuration(entry.endMinutes - entry.startMinutes);
  const timeRange = (
    <span className={styles.time}>
      {formatTime(entry.startMinutes)}
      <span className={styles.arrow}>→</span>
      {formatTime(entry.endMinutes)}
    </span>
  );

  if (editing) {
    const handleInputKey = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onCommit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    return (
      <div className={cx(styles.entry, styles.editing)}>
        <span className={styles.ticket}>{entry.ticketId}</span>
        {timeRange}
        <input
          className={styles.input}
          value={draft}
          placeholder="Add a note…"
          autoFocus
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleInputKey}
        />
        <span className={styles.dur}>{duration}</span>
        <span className={cx(styles.actions, styles.actionsVisible)}>
          <IconButton title="Save (↵)" icon={<Icons.check width="14" height="14" />} onClick={onCommit} />
          <IconButton title="Cancel (Esc)" icon={<Icons.x width="12" height="12" />} onClick={onCancel} />
        </span>
      </div>
    );
  }

  const handleRowKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === "e") {
      event.preventDefault();
      onStartEdit();
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      onDelete();
    }
  };

  const stop = (handler: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler();
  };

  return (
    <div className={styles.entry} onClick={onStartEdit} onKeyDown={handleRowKey} tabIndex={0} role="button">
      <span className={styles.ticket}>{entry.ticketId}</span>
      {timeRange}
      <span className={cx(styles.note, !entry.description && styles.noteEmpty)}>
        {entry.description || "no note"}
      </span>
      <span className={styles.dur}>{duration}</span>
      <span className={styles.actions}>
        <IconButton title="Edit (e)" icon={<Icons.edit width="14" height="14" />} onClick={stop(onStartEdit)} />
        <IconButton danger title="Delete (⌫)" icon={<Icons.trash width="13" height="13" />} onClick={stop(onDelete)} />
      </span>
    </div>
  );
}
