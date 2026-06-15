import { useEffect, useReducer } from "react";
import { initialState, reducer } from "./state/reducer";
import type { State } from "./state/reducer";
import { loadState, saveState } from "./state/persistence";
import { useConnection } from "./hooks/useConnection";
import Header from "./components/layout/Header";
import StepView from "./components/layout/StepView";
import { ConnectionGate } from "./components/connection/ConnectionGate";
import { ConnectModal } from "./components/connection/ConnectModal";
import { Frame } from "./ui/Frame/Frame";
import { Stepper } from "./ui/Stepper/Stepper";
import { Toast } from "./ui/Toast/Toast";
import { StatusDot } from "./ui/StatusDot/StatusDot";
import styles from "./App.module.css";

type Step = State["step"];

function stepToIndex(step: Step): number {
  switch (step) {
    case "paste": return 0;
    case "preview": return 1;
    case "submitting": return 2;
    case "results": return 2;
  }
}

function App() {
  // Third arg is the lazy initializer: rehydrate from localStorage (with a
  // fresh-session fallback) before the first render.
  const [state, dispatch] = useReducer(reducer, initialState, loadState);
  const conn = useConnection(dispatch, state.connection);

  // Persist the whole reducer state on every change. Cheap, and it's the single
  // source of truth, so there's nothing else to keep in sync.
  useEffect(() => {
    saveState(state);
  }, [state]);

  const currentIndex = stepToIndex(state.step);
  const locked = state.connection.status !== "connected";

  return (
    <div className={styles.app}>
      <Header connection={state.connection} onManageConnection={conn.openModal} />
      <main className={styles.page}>
        <section className={styles.hero}>
          <h1 className={styles.heroHeading}>
            Paste a day.<br />
            Log it in <em className={styles.heroEm}>one motion.</em>
          </h1>
          <p className={styles.heroSub}>
            {locked ? (
              <>
                Connect Jira to begin — click <span className={styles.heroKey}>not&nbsp;connected</span>
                <br />
                in the header, or the lock below.
              </>
            ) : (
              <>
                <strong>Connected.</strong> The wizard is live —<br />
                paste a day and parse it.
              </>
            )}
          </p>
        </section>

        <ConnectionGate locked={locked} onConnect={conn.openModal}>
          <Frame stepper={<Stepper current={currentIndex} />}>
            <StepView state={state} dispatch={dispatch} />
          </Frame>
        </ConnectionGate>
      </main>

      <ConnectModal
        open={conn.modalOpen}
        connection={state.connection}
        onConnect={conn.connectReal}
        onDemo={conn.connectDemo}
        onDisconnect={conn.disconnect}
        onCancel={conn.cancelConnect}
        onClose={conn.closeModal}
      />

      {conn.toast && (
        <Toast onDismiss={conn.dismissToast}>
          <StatusDot variant="success" />
          <span>{conn.toast}</span>
        </Toast>
      )}
    </div>
  );
}

export default App;
