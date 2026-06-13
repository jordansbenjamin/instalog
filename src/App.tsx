import { useReducer } from "react";
import { initialState, reducer } from "./state/reducer";
import type { State } from "./state/reducer";
import Header from "./components/layout/Header";
import StepView from "./components/layout/StepView";
import { Frame } from "./ui/Frame/Frame";
import { Stepper } from "./ui/Stepper/Stepper";
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
  const [state, dispatch] = useReducer(reducer, initialState);
  const currentIndex = stepToIndex(state.step);

  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <h1 className={styles.heroHeading}>
            Paste a day.<br />
            Log it in <em className={styles.heroEm}>one motion.</em>
          </h1>
          <p className={styles.heroSub}>
            <strong>instalog</strong> turns the notes you already keep into<br />
            Jira worklogs — no forms, no fields,<br />
            no context switch.
          </p>
        </section>

        <Frame stepper={<Stepper current={currentIndex} />}>
          <StepView state={state} dispatch={dispatch} />
        </Frame>
      </main>
    </div>
  );
}

export default App;
