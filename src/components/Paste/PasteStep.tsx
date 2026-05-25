import type { StepProps } from "../../types/shared";
import styles from "./PasteStep.module.css"

export default function PasteStep({state, dispatch}: StepProps) {
  return (
    <div className={styles.pasteStepView}>
      <div>PasteStep</div>
      <div>
        <textarea/>
        {/* Add step footer here */}
      </div>
    </div>
  )
}
