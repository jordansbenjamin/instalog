import type { StepProps } from "../../types/shared";
import Button from "../atoms/Button";
import StepFooter from "../StepFooter";

export default function PreviewStep({ state }: StepProps) {
  return (
    // <div className={styles.pastePreviewView}>
    <div>
      <div>PreviewStep — {state.step}</div>
      <div>
        <div>Preview Metrics</div>
        <div>Preview parsed entries</div>
        <StepFooter left={[<Button>Back to paste</Button>]}
          right={[<Button>Parse entries</Button>]}
          />
      </div>
    </div>
  )
}
