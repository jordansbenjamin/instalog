import { useCallback, useEffect, useRef, useState, type Dispatch } from "react";
import type { Action } from "../state/reducer";
import type { ConnectionState } from "../types/shared";
import {
  atlassianConnection,
  getCurrentAccount,
} from "../integration/connection/atlassianConnection";
import { demoConnection } from "../integration/connection/demoConnection";
import { reconcileConnection } from "../integration/connection/reconcileConnection";

// How long the connect-confirmation toast lingers before auto-dismissing.
const TOAST_MS = 4200;

// Orchestrates the connection flow: owns ephemeral view state (modal open? which
// toast?) and the side effects (redirect to OAuth, read /api/me, POST disconnect),
// translating them into reducer dispatches. The reducer stays a pure state machine.
//
// `connection` is the current (persisted) connection slice — needed to reconcile
// against the server session on load, and to decide whether disconnect must tear
// down a real server session or just a local demo.
export function useConnection(
  dispatch: Dispatch<Action>,
  connection: ConnectionState,
) {
  const [modalOpen, setModalOpen] = useState(false);
  // Initialise the toast from the URL: an OAuth failure redirects to ?connect=error.
  // Doing it here (not in an effect) avoids a synchronous setState-in-effect render.
  const [toast, setToast] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("connect") === "error"
      ? "Couldn't connect to Jira. Please try again."
      : null;
  });

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The connection as it was at mount — read once by the load-time reconcile.
  // (useRef(connection) captures the first value and never rewrites during render.)
  const mountConnectionRef = useRef(connection);

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

  // "Continue with Atlassian": a full-page redirect into the OAuth flow. The page
  // leaves, so there's nothing to await — connected state is relearned from
  // /api/me when Atlassian redirects back (the mount effect below).
  const connectReal = useCallback(() => {
    dispatch({ type: "CONNECT_STARTED" });
    void atlassianConnection.connect();
  }, [dispatch]);

  // "Explore the demo": instant, client-side only — straight to connected.
  const connectDemo = useCallback(() => {
    void demoConnection.connect().then((account) => {
      dispatch({ type: "CONNECT_SUCCEEDED", account });
      showToast("Demo mode — worklogs are simulated");
    });
  }, [dispatch, showToast]);

  // Disconnect: tear down the server session for a real connection (demo has none).
  const disconnect = useCallback(() => {
    if (connection.account && !connection.account.isDemo) {
      void atlassianConnection.disconnect();
    }
    dispatch({ type: "DISCONNECT" });
  }, [dispatch, connection]);

  // From the connecting modal's Cancel: drop back to disconnected and close.
  const cancelConnect = useCallback(() => {
    dispatch({ type: "DISCONNECT" });
    setModalOpen(false);
  }, [dispatch]);

  // On mount: clean an OAuth error param from the URL (the toast for it was set in
  // the initialiser above), then hydrate connected state from the server session.
  // /api/me is authoritative for a real connection; a persisted demo is left alone.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connect") === "error") {
      window.history.replaceState({}, "", window.location.pathname);
      toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
    }

    let cancelled = false;
    void getCurrentAccount().then((account) => {
      if (cancelled) return;
      const action = reconcileConnection(mountConnectionRef.current, account);
      if (action.type === "connect") {
        dispatch({ type: "CONNECT_SUCCEEDED", account: action.account });
      } else if (action.type === "disconnect") {
        dispatch({ type: "DISCONNECT" });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  // Clear the toast timer on unmount.
  useEffect(() => {
    return () => {
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
