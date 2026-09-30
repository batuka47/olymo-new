"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = Omit<Extract<ButtonProps, { href?: undefined }>, "type"> & {
  pendingLabel: string;
};

/** Submit button that disables itself and shows `pendingLabel` while its form is submitting. */
export function SubmitButton({ children, pendingLabel, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} aria-disabled={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
