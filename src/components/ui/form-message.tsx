import { cx } from "@/lib/cx";

export interface FormState {
  error?: string;
  success?: string;
}

interface FormMessageProps {
  state: FormState;
  className?: string;
}

export function FormMessage({ state, className }: FormMessageProps) {
  if (state.error) {
    return (
      <p
        role="alert"
        className={cx("border-l-2 border-danger pl-3 text-sm text-danger", className)}
      >
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className={cx("border-l-2 border-accent pl-3 text-sm", className)}>
        {state.success}
      </p>
    );
  }
  return null;
}
