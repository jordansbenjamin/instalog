import type { StepProps } from "../../types/shared";
import PasteStep from "../Paste/PasteStep";
import PreviewStep from "../Preview/PreviewStep";
import ResultsStep from "../Results/ResultsStep";
import SubmittingStep from "../Submitting/SubmittingStep";

function renderStep(state, dispatch) {
  switch (state.step) {
    case 'paste': return <PasteStep state={state} dispatch={dispatch}/>
    case 'preview': return <PreviewStep state={state} dispatch={dispatch}/>
    case 'submitting': return <SubmittingStep state={state} dispatch={dispatch}/>
    case 'results': return <ResultsStep state={state} dispatch={dispatch}/>
  }
}

export default function StepView({state, dispatch}: StepProps) {
  return (
    <main>
      <div className="app-container">
        {/* render step progress here */}
        {renderStep(state, dispatch)}
      </div>
    </main>
  )
}
