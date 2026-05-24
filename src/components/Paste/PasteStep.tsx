import type { StepProps } from "../../types/shared";
import styles from "./PasteStep.module.css"

export default function PasteStep({state, dispatch}: StepProps) {
  return (
    <div className={styles.pasteStepView}>
      <div>PasteStep</div>
      <div>
        <textarea/>
        <div>
          <button>Clear</button>
          <button>Load example</button>
        </div>
        <div>
          <button>Parse entries</button>
        </div>
      </div>
    </div>
  )
}
