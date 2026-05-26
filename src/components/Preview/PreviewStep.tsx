import type { StepProps } from "../../types/shared";
import Button from "../atoms/Button";
import StepFooter from "../StepFooter";

export default function PreviewStep({state, dispatch}: StepProps) {
  return (
    // <div className={styles.pastePreviewView}>
    <div>
      <div>PreviewStep</div>
      <div>
        <div>Preview Metrics</div>
        <div>Previe parsed entries</div>
        <StepFooter left={[<Button>Back to paste</Button>]}
          right={[<Button>Parse entries</Button>]}
          />
      </div>
    </div>
  )
}
