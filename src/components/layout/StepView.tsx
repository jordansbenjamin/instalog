import type { Dispatch } from "react";
import type { Action, State } from "../../state/reducer";
import type { StepProps } from "../../types/shared";
import PasteStep from "../Paste/PasteStep";
import PreviewStep from "../Preview/PreviewStep";
import ResultsStep from "../Results/ResultsStep";
import SubmittingStep from "../Submitting/SubmittingStep";
import styles from "./StepView.module.css"
import StepProgress from "../StepProgress";

function renderStep(state: State, dispatch: Dispatch<Action>) {
  switch (state.step) {
    case 'paste': return <PasteStep state={state} dispatch={dispatch}/>
    case 'preview': return <PreviewStep state={state} dispatch={dispatch}/>
    case 'submitting': return <SubmittingStep state={state} dispatch={dispatch}/>
    case 'results': return <ResultsStep state={state} dispatch={dispatch}/>
  }
}

export default function StepView({state, dispatch}: StepProps) {
  return (
    <div className={styles.appContainer}>
      <StepProgress />
      {renderStep(state, dispatch)}
    </div>
  )
}
