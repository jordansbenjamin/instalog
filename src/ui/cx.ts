type ClassValue = string | false | null | undefined;

/**
 * Join truthy class names into a single string.
 * A tiny, dependency-free stand-in for `clsx` — enough for combining a
 * base CSS-Module class with conditional modifier classes:
 *   cx(styles.button, isPrimary && styles.primary)
 */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
