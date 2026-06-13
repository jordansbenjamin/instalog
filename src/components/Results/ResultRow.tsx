import type { ParsedEntry, SubmissionResult } from "../../types/shared";
import { formatTime, formatDuration } from "../../domain/format";
import { cx } from "../../ui/cx";
import { Badge } from "../../ui/Badge/Badge";
import { IconButton } from "../../ui/IconButton/IconButton";
import { Icons } from "../../ui/icons/Icons";
import styles from "./ResultRow.module.css";

interface ResultRowProps {
  entry: ParsedEntry;
  result: SubmissionResult;
  onRetry: () => void;
}

export function ResultRow({ entry, result, onRetry }: ResultRowProps) {
  const duration = formatDuration(entry.endMinutes - entry.startMinutes);

  return (
    <div className={cx(styles.result, !result.ok && styles.err)}>
      {result.ok ? (
        <Badge kind="ok">
          <svg className={styles.checkDraw} viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="8" />
            <path d="M4.5 8l2.5 2.5L11.5 6" />
          </svg>
          201
        </Badge>
      ) : (
        <Badge kind="err">
          <Icons.x width="10" height="10" />
          {result.status ?? "ERR"}
        </Badge>
      )}

      <span className={styles.ticket}>{entry.ticketId}</span>

      <div className={styles.details}>
        <span className={styles.time}>
          {formatTime(entry.startMinutes)}
          <span className={styles.arrow}>→</span>
          {formatTime(entry.endMinutes)}
        </span>
        {!result.ok && <div className={styles.errMsg}>{result.message}</div>}
      </div>

      <span className={cx(styles.note, !entry.description && styles.noteEmpty)}>
        {entry.description || "—"}
      </span>

      <span className={styles.dur}>{duration}</span>

      <span className={styles.actions}>
        {!result.ok && (
          <IconButton title="Retry failed entries" icon={<Icons.retry width="13" height="13" />} onClick={onRetry} />
        )}
      </span>
    </div>
  );
}
