import clsx from "clsx";
import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  helper?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
};

/** Standard label + input + helper/error block. Use for any single form field. */
export function FormField({
  label,
  htmlFor,
  required = false,
  optional = false,
  helper,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={clsx("space-y-2", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-textStrong">
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
        {optional ? <span className="ml-1 text-xs font-normal text-textMuted">Optional</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : helper ? (
        <p className="text-xs text-textMuted">{helper}</p>
      ) : null}
    </div>
  );
}
