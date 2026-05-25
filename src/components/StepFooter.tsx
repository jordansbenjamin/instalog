import styles from "./StepFooter.module.css"

interface StepFooterProps {
  left?: React.ReactNode[];
  right?: React.ReactNode[];
}

export default function StepFooter({left, right}: StepFooterProps) {
  return (
    <div className={styles.stepFooterContainer}>
      <div className={styles.stepFooterInnerContainer}>
        {left?.map(el => el)}
      </div>
      <div className={styles.stepFooterInnerContainer}>
        {right?.map(el => el)}
      </div>
    </div>
  )
}
