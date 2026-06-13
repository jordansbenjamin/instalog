import { useEffect } from "react";
import type { ParsedEntry, StepProps, SubmissionResult } from "../../types/shared";
import { formatTime, formatDuration } from "../../domain/format";
import { Button } from "../../ui/Button/Button";
import { Metric, Metrics } from "../../ui/Metric/Metric";
import { Icons } from "../../ui/icons/Icons";
import { ResultRow } from "./ResultRow";
import styles from "./ResultsStep.module.css";

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function resultsToCsv(entries: ParsedEntry[], results: SubmissionResult[]): string {
  const header = ["Ticket", "Start", "End", "Duration", "Status", "Note", "Detail"];
  const rows = entries.map((entry, index) => {
    const result = results[index];
    return [
      entry.ticketId,
      formatTime(entry.startMinutes),
      formatTime(entry.endMinutes),
      formatDuration(entry.endMinutes - entry.startMinutes),
      result?.ok ? "logged" : "failed",
      entry.description ?? "",
      result && !result.ok ? result.message : "",
    ];
  });
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ResultsStep({ state, dispatch }: StepProps) {
  const result = state.parsedResult;
  const entries = result && result.success ? result.entries : [];
  const results = state.submissionResults;
  const failedCount = results.filter((row) => row && !row.ok).length;

  // 'R' retries the failures — ignored while typing in a field.
  useEffect(() => {
    if (failedCount === 0) return;
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (event.key.toLowerCase() === "r" && !event.metaKey && !event.ctrlKey && tag !== "INPUT" && tag !== "TEXTAREA") {
        event.preventDefault();
        dispatch({ type: "RETRY_SUBMISSION" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [failedCount, dispatch]);

  if (!result || !result.success) return null;

  const loggedCount = results.filter((row) => row?.ok).length;
  const loggedMinutes = entries.reduce(
    (sum, entry, index) => (results[index]?.ok ? sum + (entry.endMinutes - entry.startMinutes) : sum),
    0,
  );
  const failedMinutes = entries.reduce(
    (sum, entry, index) => (results[index] && !results[index].ok ? sum + (entry.endMinutes - entry.startMinutes) : sum),
    0,
  );
  const loggedHours = Math.floor(loggedMinutes / 60);
  const loggedMins = (loggedMinutes % 60).toString().padStart(2, "0");

  const retry = () => dispatch({ type: "RETRY_SUBMISSION" });
  const startOver = () => dispatch({ type: "RESET" });
  const exportReport = () => downloadCsv("instalog-worklog.csv", resultsToCsv(entries, results));

  return (
    <div className={styles.step}>
      <Metrics>
        <Metric
          label="Logged"
          tone="success"
          icon={<Icons.check width="11" height="11" />}
          value={loggedCount}
          unit={`/${entries.length}`}
        />
        <Metric
          label="Time posted"
          tone="success"
          value={
            <>
              {loggedHours}
              <span className={styles.unit}>h</span> {loggedMins}
              <span className={styles.unit}>m</span>
            </>
          }
        />
        <Metric
          label="Failed"
          tone={failedCount > 0 ? "error" : undefined}
          icon={failedCount > 0 ? <Icons.x width="11" height="11" /> : undefined}
          value={failedCount}
        />
      </Metrics>

      <div className={styles.list}>
        <div className={styles.listHead}>
          <span>Worklog responses</span>
          <span>{failedCount > 0 ? "Failed rows can be retried" : "All worklogs posted"}</span>
        </div>
        <div className={styles.listBody}>
          {entries.map((entry, index) =>
            results[index] ? (
              <ResultRow key={entry.lineNumber} entry={entry} result={results[index]} onRetry={retry} />
            ) : null,
          )}
        </div>
        <div className={styles.listFoot}>
          <span>
            <strong>
              {loggedHours}h {loggedMins}m
            </strong>{" "}
            logged
            {failedCount > 0 && (
              <span className={styles.warnText}>
                {" "}
                · {failedCount} {failedCount === 1 ? "entry" : "entries"} ({formatDuration(failedMinutes)}) need attention
              </span>
            )}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.actionsGroup}>
          <Button icon={<Icons.download width="14" height="14" />} onClick={exportReport}>
            Export report
          </Button>
          <Button onClick={startOver}>Start over</Button>
        </div>
        <div className={styles.actionsGroup}>
          {failedCount > 0 && (
            <Button variant="primary" iconAfter={<Icons.retry width="15" height="15" />} kbd={["R"]} onClick={retry}>
              Retry {failedCount} failed
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
