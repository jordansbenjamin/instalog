import { useState } from "react";
import { Modal } from "../../ui/Modal/Modal";
import { Button } from "../../ui/Button/Button";
import { IconButton } from "../../ui/IconButton/IconButton";
import { Icons } from "../../ui/icons/Icons";
import { cx } from "../../ui/cx";
import type { FeedbackType } from "../../types/shared";
import type { FeedbackStatus, FeedbackFormInput } from "../../hooks/useFeedback";
import styles from "./FeedbackModal.module.css";

interface FeedbackModalProps {
  open: boolean;
  status: FeedbackStatus;
  error: string | null;
  onSubmit: (input: FeedbackFormInput) => void;
  onClose: () => void;
}

const TYPES: { value: FeedbackType; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "idea", label: "Idea" },
];

export function FeedbackModal({ open, status, error, onSubmit, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const sending = status === "sending";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ type, message, email, honeypot });
  };

  return (
    <Modal open={open} onClose={onClose} dismissable={!sending}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <header className={styles.head}>
          <h2 className={styles.title}>Send feedback</h2>
          <IconButton
            icon={<Icons.close width="16" height="16" />}
            aria-label="Close"
            onClick={onClose}
            disabled={sending}
          />
        </header>

        <div className={styles.types} role="group" aria-label="Feedback type">
          {TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cx(styles.type, type === option.value && styles.typeActive)}
              aria-pressed={type === option.value}
              onClick={() => setType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className={styles.label} htmlFor="feedback-message">
          {type === "bug" ? "What went wrong?" : "What would make this better?"}
        </label>
        <textarea
          id="feedback-message"
          className={styles.textarea}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          maxLength={5000}
          autoFocus
          placeholder={type === "bug" ? "Describe the bug…" : "Describe your idea…"}
        />

        <label className={styles.label} htmlFor="feedback-email">
          Your email <span className={styles.optional}>(optional, for a reply)</span>
        </label>
        <input
          id="feedback-email"
          className={styles.input}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />

        {/* Honeypot: hidden from humans, tempting to bots. Real submissions leave it empty. */}
        <input
          className={styles.honeypot}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={sending}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
