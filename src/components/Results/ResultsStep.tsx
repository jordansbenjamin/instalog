import type { StepProps } from "../../types/shared";
import Button from "../atoms/Button";
import StepFooter from "../StepFooter";

export default function ResultsStep({state, dispatch}: StepProps) {
  return (
    // <div className={styles.pastePreviewView}>
    <div>
      <div>ResultsStep</div>
      <div>
        <div>Results Metrics</div>
        <div>Worklog responses</div>
        <StepFooter left={[
          <Button>Export report</Button>,
          <Button>Start over</Button>,
        ]}
          right={[<Button>Retry</Button>]}
          />
      </div>
    </div>
  )
}
