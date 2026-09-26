"use client";
import { useId, type InputHTMLAttributes, type Ref } from "react";

/** A text-entry input. Prefer Field so its label and messages stay connected. */
export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "className" | "style" | "color" | "type" | "dangerouslySetInnerHTML"
> {
  /** Native text-entry type. Other controls have their own components. @default text */
  type?: "text" | "email" | "password" | "search" | "tel" | "url";
  /** Use numeric inputMode for decimal entry; validation stays with the caller. */
  ref?: Ref<HTMLInputElement>;
}
/** Render a native input. Controlled inputs use value and native onChange(event). */
export function Input({ type = "text", ...props }: InputProps) {
  return <input {...props} type={type} className="k-input" />;
}

/** A labelled input with accessible help and error associations. */
export interface FieldProps extends InputProps {
  /** Visible label, never a placeholder substitute. */
  label: string;
  /** Supporting instructions. */
  description?: string;
  /** Validation supplied by the application. */
  error?: string;
}
/** Compose a label, input, help and error without caller-managed ID plumbing. */
export function Field({
  label,
  description,
  error,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...props
}: FieldProps) {
  const generated = useId();
  const inputId = id ?? `klein-field-${generated}`;
  const descriptions =
    [
      describedBy,
      description ? `${inputId}-help` : "",
      error ? `${inputId}-error` : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="k-field">
      <label htmlFor={inputId} className="k-field-label">
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      <Input
        {...props}
        id={inputId}
        aria-describedby={descriptions}
        aria-invalid={error ? true : invalid}
      />
      {description && (
        <p className="k-field-help" id={`${inputId}-help`}>
          {description}
        </p>
      )}
      {error && (
        <p className="k-field-error" id={`${inputId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
