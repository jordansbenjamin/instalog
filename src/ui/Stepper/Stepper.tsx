import { Fragment } from "react";
import { cx } from "../cx";
import { Icons } from "../icons/Icons";
import styles from "./Stepper.module.css";

interface StepperProps {
  current?: number;
  completed?: boolean[];
  steps?: string[];
  onJump?: (index: number) => void;
}

export function Stepper({
  current = 0,
  completed = [],
  steps = ["Paste", "Preview", "Submit"],
  onJump,
}: StepperProps) {
  return (
    <div className={styles.stepper}>
      {steps.map((label, index) => {
        const done = index < current || completed[index];
        const active = index === current && !completed[index];
        return (
          <Fragment key={index}>
            <div
              className={cx(styles.item, active && styles.active, done && styles.done)}
              onClick={() => onJump?.(index)}
              role="button"
              tabIndex={0}
            >
              <span className={styles.num}>
                {done ? <Icons.check width="11" height="11" /> : index + 1}
              </span>
              <span>{label}</span>
            </div>
            {index < steps.length - 1 && <div className={cx(styles.sep, done && styles.sepDone)} />}
          </Fragment>
        );
      })}
    </div>
  );
}
