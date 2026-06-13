import { Fragment, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { HighlightTokenType, LineInfo, LineKind } from "../../types/shared";
import { cx } from "../../ui/cx";
import styles from "./PasteEditor.module.css";

// Gutter glyph per line kind. Blank lines carry no marker.
const MARKER: Record<LineKind, string> = {
  date: "◆",
  ok: "✓",
  skip: "⏵",
  err: "!",
  blank: "",
};

// Highlight colour class per token type. "plain" stays uncoloured (the textarea
// caret colour shows through nothing — the overlay text just inherits ink).
const TOKEN_CLASS: Record<HighlightTokenType, string | undefined> = {
  ticket: styles.tk,
  time: styles.tm,
  comment: styles.co,
  date: styles.dt,
  skip: styles.sk,
  plain: undefined,
};

interface PasteEditorProps {
  value: string;
  onChange: (value: string) => void;
  lines: LineInfo[];
  dateLabel: string;
  entryCount: number;
  skippedCount: number;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

export function PasteEditor({
  value,
  onChange,
  lines,
  dateLabel,
  entryCount,
  skippedCount,
  onSubmit,
  autoFocus,
}: PasteEditorProps) {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Grow the textarea to fit its content so it never scrolls vertically — the
  // gutter is a grid sibling and stays aligned only because nothing scrolls
  // inside the textarea.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  // The one case either layer scrolls is a long, non-wrapping line — keep the
  // overlay's horizontal offset matched to the textarea's.
  const handleScroll = () => {
    const textarea = textareaRef.current;
    const overlay = overlayRef.current;
    if (textarea && overlay) overlay.scrollLeft = textarea.scrollLeft;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onSubmit?.();
    }
  };

  const isEmpty = value.trim().length === 0;
  const lineCount = value.split("\n").length;

  return (
    <div className={cx(styles.paste, focused && styles.focused)}>
      <div className={styles.grid}>
        <div className={styles.gutter} aria-hidden="true">
          {lines.map((line) => (
            <div key={line.lineNumber} className={cx(styles.ln, styles[line.kind])}>
              <span className={styles.lnIcon}>{MARKER[line.kind]}</span>
              <span className={styles.lnNum}>{line.lineNumber}</span>
            </div>
          ))}
        </div>

        <div className={styles.editor}>
          {isEmpty && (
            <div className={styles.placeholder} aria-hidden="true">
              <div>16/3/26</div>
              <div className={styles.ex}>ABC-123 9:00am-10:30am</div>
              <div className={styles.ex}>XYZ-45 10:30am-11:50am (standup)</div>
              <span className={styles.placeholderHint}>// paste, type, or drop a file — any format is fine</span>
            </div>
          )}

          {/* Highlight overlay — a single pre-formatted flow under the textarea.
              Newlines between lines keep its rows on the same baseline as the
              gutter; the tokens reconstruct each line exactly. */}
          <div ref={overlayRef} className={styles.highlight} aria-hidden="true">
            {lines.map((line, index) => (
              <Fragment key={line.lineNumber}>
                {line.tokens.map((token, tokenIndex) => (
                  <span key={tokenIndex} className={TOKEN_CLASS[token.type]}>
                    {token.text}
                  </span>
                ))}
                {index < lines.length - 1 ? "\n" : "\u200B"}
              </Fragment>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            className={styles.input}
            value={value}
            spellCheck={false}
            wrap="off"
            autoFocus={autoFocus}
            onChange={(event) => onChange(event.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
      </div>

      <div className={styles.foot}>
        <div className={styles.footLeft}>
          {!isEmpty && <span className={styles.live}>detecting</span>}
          <span>Date <strong>{dateLabel}</strong></span>
          <span>Entries <strong>{entryCount}</strong></span>
          <span>Skipped <strong>{skippedCount}</strong></span>
        </div>
        <div className={styles.footRight}>
          Ln {lineCount} · {value.length} chars
        </div>
      </div>
    </div>
  );
}
