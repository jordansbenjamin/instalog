import { useMemo } from "react";
import type { StepProps } from "../../types/shared";
import { parseTimesheet } from "../../domain/parser";
import { formatDate } from "../../domain/format";
import { Button } from "../../ui/Button/Button";
import { Kbd } from "../../ui/Kbd/Kbd";
// import { SuggestChip } from "../../ui/SuggestChip/SuggestChip";
import { Icons } from "../../ui/icons/Icons";
import { PasteEditor } from "./PasteEditor";
import styles from "./PasteStep.module.css";

const EXAMPLE = `16/3/26

ACME-4126 8:40am-9:18am
WEB-204 9:18am-10am
PLAT-58 10am-10:30am
DSN-92 10:37am-12:35pm
Lunch 12:35pm-1:15pm
WEB-204 1:15pm-2:38pm
PLAT-318 2:38pm-3:04pm (slack)
DSN-92 3:28pm-3:50pm (Helping Sam w/ Horizon)
PLAT-140 3:50pm-5pm (timesheets + OKR)`;

// Hardcoded demo heuristic for the smart-fix chip. A real implementation would
// check ticket keys against the connected project; for now it nudges a single
// known typo so the interaction is demonstrable.
// const SUGGESTION = { wrong: "PLAT-318", right: "PLAT-381" } as const;

export default function PasteStep({ state, dispatch }: StepProps) {
  const text = state.text;
  const parsed = useMemo(() => parseTimesheet(text), [text]);

  // Live footer stats come from the per-line classification, so they update on
  // every keystroke — even before the parse as a whole can advance.
  const entryCount = parsed.lines.filter((line) => line.kind === "ok").length;
  const skippedCount = parsed.lines.filter((line) => line.kind === "skip").length;
  const formatted = parsed.success ? formatDate(parsed.date) : null;
  const dateLabel = formatted ? `${formatted.weekday}, ${formatted.day} ${formatted.month}` : "—";
  const canParse = parsed.success && parsed.entries.length > 0;

  const setText = (next: string) => dispatch({ type: "TEXT_CHANGED", text: next });
  const handleParse = () => {
    if (parsed.success) dispatch({ type: "PARSE_RESULT", parsedResult: parsed });
  };

  // const showSuggestion = new RegExp(`\\b${SUGGESTION.wrong}\\b`).test(text);
  // const applySuggestion = () =>
  //   setText(text.replace(new RegExp(`\\b${SUGGESTION.wrong}\\b`, "g"), SUGGESTION.right));

  return (
    <div className={styles.step}>
      <div className={styles.head}>
        <h3 className={styles.title}>Paste your timesheet</h3>
        <span className={styles.hint}>
          <Kbd>{["⌘", "V"]}</Kbd>
          <span className={styles.hintText}>or drag a file</span>
        </span>
      </div>

      {/* {showSuggestion && (
        <div className={styles.suggestWrap}>
          <SuggestChip onApply={applySuggestion}>
            <strong>{SUGGESTION.wrong}</strong> looks off — did you mean <strong>{SUGGESTION.right}</strong>?
          </SuggestChip>
        </div>
      )} */}

      <PasteEditor
        value={text}
        onChange={setText}
        lines={parsed.lines}
        dateLabel={dateLabel}
        entryCount={entryCount}
        skippedCount={skippedCount}
        onSubmit={handleParse}
        autoFocus
      />

      <div className={styles.actions}>
        <div className={styles.actionsGroup}>
          <Button onClick={() => setText("")}>Clear</Button>
          <Button onClick={() => setText(EXAMPLE)}>Load example</Button>
        </div>
        <div className={styles.actionsGroup}>
          <Button
            variant="primary"
            iconAfter={<Icons.arrow width="15" height="15" />}
            kbd={["⌘", "↵"]}
            disabled={!canParse}
            onClick={handleParse}
          >
            Parse entries
          </Button>
        </div>
      </div>
    </div>
  );
}
