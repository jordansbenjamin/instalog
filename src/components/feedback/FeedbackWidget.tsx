import { useState } from "react";
import { Icons } from "../../ui/icons/Icons";
import { Toast } from "../../ui/Toast/Toast";
import { StatusDot } from "../../ui/StatusDot/StatusDot";
import { useFeedback } from "../../hooks/useFeedback";
import { FeedbackModal } from "./FeedbackModal";
import styles from "./FeedbackWidget.module.css";

interface FeedbackWidgetProps {
  step: string;
  isDemo: boolean;
}

export function FeedbackWidget({ step, isDemo }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const { status, error, submit, reset } = useFeedback({ step, isDemo });

  const openModal = () => {
    reset();
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    reset();
  };

  // Close + toast once a send succeeds.
  if (status === "sent" && open) {
    setOpen(false);
  }

  return (
    <>
      <button type="button" className={styles.pill} onClick={openModal} aria-label="Send feedback">
        <Icons.bug width="16" height="16" />
        <span>Feedback</span>
      </button>

      <FeedbackModal
        open={open}
        status={status}
        error={error}
        onSubmit={submit}
        onClose={closeModal}
      />

      {status === "sent" && (
        <Toast onDismiss={reset}>
          <StatusDot variant="success" />
          <span>Thanks — your feedback was sent.</span>
        </Toast>
      )}
    </>
  );
}
