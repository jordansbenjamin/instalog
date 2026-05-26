import styles from "./Button.module.css"

type ButtonProps = React.ComponentPropsWithoutRef<"button">;

export default function Button({children, ...props}: ButtonProps) {
  return (
    <button className={styles.button} {...props}>
      {children}
    </button>
  )
}
