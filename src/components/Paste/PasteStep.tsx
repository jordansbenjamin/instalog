import type { StepProps } from "../../types/shared";
import StepFooter from "../StepFooter";
import styles from "./PasteStep.module.css"

export default function PasteStep({state, dispatch}: StepProps) {
  return (
    <div className={styles.pasteStepView}>
      <div>PasteStep</div>
      <div>
        <textarea/>
        <StepFooter left={[
          <button>Clear</button>, 
          <button>Load example</button>
          ]}
          right={[<button>Parse entries</button>]}
          />
      </div>
    </div>
  )
}
