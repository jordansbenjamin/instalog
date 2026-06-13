import type { StepProps } from "../../types/shared";
import { useSubmission } from "../../hooks/useSubmission";
import { formatDuration } from "../../domain/format";
import { cx } from "../../ui/cx";
import { Spinner } from "../../ui/Spinner/Spinner";
import { Progress } from "../../ui/Progress/Progress";
import styles from "./SubmittingStep.module.css";

const TAG: Record<string, string> = { ok: "✓", err: "×", pending: "◐" };

export default function SubmittingStep({ state, dispatch }: StepProps) {
  const { log, progress, total } = useSubmission(state, dispatch);

  const result = state.parsedResult;
  const entries = result && result.success ? result.entries : [];

  // The last appended log row carries the entry index currently in flight — this
  // holds even on a retry, which submits a non-contiguous subset of entries.
  const currentEntry = entries[log[log.length - 1]?.index ?? 0];
  const currentTicket = currentEntry?.ticketId ?? "—";
  const currentDuration = currentEntry ? formatDuration(currentEntry.endMinutes - currentEntry.startMinutes) : "";

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h3 className={styles.title}>
          <Spinner /> Submitting to Jira
        </h3>
        <span className={styles.count}>
          {Math.min(log.length, total)}/{total}
        </span>
      </div>

      <Progress value={progress} />
      <div className={styles.meta}>
        <span>
          Posting worklog · <strong>{currentTicket}</strong>
          {currentDuration && ` · ${currentDuration}`}
        </span>
        <span>{progress}%</span>
      </div>

      <div className={styles.log}>
        {log.map((row, index) => (
          <div key={index} className={cx(styles.logRow, styles[row.state])}>
            <span className={styles.tag}>{TAG[row.state]}</span>
            <span className={styles.time}>{row.time}</span>
            <span className={styles.msg}>{row.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
