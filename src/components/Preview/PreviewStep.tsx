import type { StepProps } from "../../types/shared";
import Button from "../atoms/Button";
import StepFooter from "../StepFooter";

export default function PreviewStep({state, dispatch}: StepProps) {
  return (
    // <div className={styles.pastePreviewView}>
    <div>
      <div>PreviewStep</div>
      <div>
        <textarea/>
        <StepFooter left={[
          <Button>Clear</Button>, 
          <Button>Load example</Button>
          ]}
          right={[<Button>Parse entries</Button>]}
          />
      </div>
    </div>
  )
}
