import { useCallback, useEffect, useRef, useState, type Dispatch } from "react";
import type { Action } from "../state/reducer";
import { simulatedConnection } from "../integration/connection/simulatedConnection";
import { demoConnection } from "../integration/connection/demoConnection";

// How long the connect-confirmation toast lingers before auto-dismissing.
const TOAST_MS = 4200;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

// Orchestrates the connection flow: it owns the ephemeral view state (is the
// modal open? which toast is showing?) and the side effects (calling the
// services, the abort controller), translating both into reducer dispatches.
// The reducer stays a pure state machine; all the async lives here.
export function useConnection(dispatch: Dispatch<Action>) {
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // The in-flight connect, so Cancel/disconnect can truly abort it.
  const abortRef = useRef<AbortController | null>(null);
  // The auto-dismiss timer, kept in a ref so a new toast cancels the old timer.
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  // "Continue with Atlassian": show the connecting state, then resolve. The
  // .then/.catch chain keeps this callback synchronous (returns void), so call
  // sites can pass it straight to onClick.
  const connectReal = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "CONNECT_STARTED" });
    void simulatedConnection
      .connect(controller.signal)
      .then((account) => {
        dispatch({ type: "CONNECT_SUCCEEDED", account });
        showToast(`Connected to ${account.site}`);
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return; // cancelled — cancelConnect already reverted state
        dispatch({ type: "DISCONNECT" }); // unexpected failure: fall back to disconnected
      });
  }, [dispatch, showToast]);

  // "Explore the demo": instant, no connecting state — straight to connected.
  const connectDemo = useCallback(() => {
    abortRef.current?.abort();
    void demoConnection.connect().then((account) => {
      dispatch({ type: "CONNECT_SUCCEEDED", account });
      showToast("Demo mode — worklogs are simulated");
    });
  }, [dispatch, showToast]);

  // From the connected modal's Disconnect/Exit-demo button: re-lock the gate.
  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "DISCONNECT" });
  }, [dispatch]);

  // From the connecting modal's Cancel: abort the handshake and leave entirely.
  const cancelConnect = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "DISCONNECT" });
    setModalOpen(false);
  }, [dispatch]);

  // On unmount, abort any in-flight connect and clear the toast timer.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  return {
    modalOpen,
    toast,
    openModal,
    closeModal,
    connectReal,
    connectDemo,
    disconnect,
    cancelConnect,
    dismissToast,
  };
}
