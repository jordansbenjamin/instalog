import type { StepProps } from "../../types/shared";

export default function SubmittingStep({ state }: StepProps) {
  return (
    <div>SubmittingStep — {state.step}</div>
  )
}
