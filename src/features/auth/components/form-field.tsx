import type { InputHTMLAttributes } from "react";

import { Input } from "../../../components/ui/input";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
};

export function FormField({ error, id, label, ...props }: FormFieldProps) {
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <Input
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        id={id}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm font-medium text-destructive" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
