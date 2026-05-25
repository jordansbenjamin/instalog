import type { StepProps } from "../../types/shared";
import Button from "../atoms/Button";
import StepFooter from "../StepFooter";
import styles from "./PasteStep.module.css"

export default function PasteStep({state, dispatch}: StepProps) {
  return (
    <div className={styles.pasteStepView}>
      <div>PasteStep</div>
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
