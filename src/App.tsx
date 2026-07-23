import { useEffect, useReducer, useRef, useState } from "react";
import { initialState, reducer } from "./state/reducer";
import type { State } from "./state/reducer";
import { loadState, saveState } from "./state/persistence";
import { useConnection } from "./hooks/useConnection";
import { useTicketReferences } from "./hooks/useTicketReferences";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import StepView from "./components/layout/StepView";
import { ConnectionGate } from "./components/connection/ConnectionGate";
import { ConnectModal } from "./components/connection/ConnectModal";
import { FeedbackWidget } from "./components/feedback/FeedbackWidget";
import { TicketReferenceDrawer } from "./components/TicketReference/TicketReferenceDrawer";
import { TicketReferencePanel } from "./components/TicketReference/TicketReferencePanel";
import { Frame } from "./ui/Frame/Frame";
import { Stepper } from "./ui/Stepper/Stepper";
import { Toast } from "./ui/Toast/Toast";
import { StatusDot } from "./ui/StatusDot/StatusDot";
import { Icons } from "./ui/icons/Icons";
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
  const ticketReferences = useTicketReferences();
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false);
  const ticketDrawerTriggerRef = useRef<HTMLButtonElement>(null);

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
        {/* <section className={styles.hero}>
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
        </section> */}

        <button
          ref={ticketDrawerTriggerRef}
          type="button"
          className={styles.ticketDrawerTrigger}
          aria-expanded={ticketDrawerOpen}
          aria-controls="ticket-reference-drawer"
          onClick={() => setTicketDrawerOpen(true)}
        >
          <Icons.tickets width="16" height="16" aria-hidden="true" />
          Tickets
          <span>{ticketReferences.tickets.length}</span>
        </button>

        <div className={styles.workspace}>
          <div className={styles.wizard}>
            <ConnectionGate locked={locked} onConnect={conn.openModal}>
              <Frame stepper={<Stepper current={currentIndex} />}>
                <StepView state={state} dispatch={dispatch} />
              </Frame>
            </ConnectionGate>
          </div>

          <div className={styles.ticketRail}>
            <TicketReferencePanel
              references={ticketReferences}
              headingId="desktop-ticket-reference-heading"
            />
          </div>
        </div>
      </main>

      <Footer />

      <FeedbackWidget
        step={state.step}
        isDemo={state.connection.account?.isDemo ?? false}
      />

      <ConnectModal
        open={conn.modalOpen}
        connection={state.connection}
        onConnect={conn.connectReal}
        onDemo={conn.connectDemo}
        onDisconnect={conn.disconnect}
        onCancel={conn.cancelConnect}
        onClose={conn.closeModal}
      />

      <TicketReferenceDrawer
        open={ticketDrawerOpen}
        triggerRef={ticketDrawerTriggerRef}
        onClose={() => setTicketDrawerOpen(false)}
      >
        <div id="ticket-reference-drawer">
          <TicketReferencePanel
            references={ticketReferences}
            headingId="drawer-ticket-reference-heading"
          />
        </div>
      </TicketReferenceDrawer>

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
