import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  // When false, Esc and click-outside are inert — the modal can only be closed
  // by an explicit control inside it. Used for the connecting handshake.
  dismissable?: boolean;
  children: ReactNode;
}

export function Modal({ open, onClose, dismissable = true, children }: ModalProps) {
  // Esc-to-close, only while open and dismissable. The cleanup detaches the
  // listener so closed modals never intercept keystrokes.
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissable, onClose]);

  if (!open) return null;

  // Portal to <body> so the fixed-position scrim escapes any ancestor that
  // creates a containing block — notably the gate's `filter`, which would
  // otherwise trap a plain fixed element inside the blurred wizard.
  return createPortal(
    <div
      className={styles.scrim}
      onMouseDown={(event) => {
        // Only a click on the scrim itself (not a bubbled click from the card)
        // dismisses — and only when dismissable.
        if (dismissable && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body
  );
}
