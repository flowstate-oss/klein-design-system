"use client";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

type NativeButton = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "style" | "color" | "children" | "dangerouslySetInnerHTML"
>;
type Appearance =
  | { variant?: "primary"; tone?: "neutral" | "accent" | "danger" }
  | { variant: "secondary" | "tertiary"; tone?: "neutral" }
  | { variant: "text"; tone?: "accent" };

/** A single action. Use one primary action per view; danger only in confirmations. */
export type ButtonProps = NativeButton &
  Appearance & {
    /** Visible, sentence-case action label. */
    children: ReactNode;
    /** Control height: 32, 40 or 48px. @default md */
    size?: "sm" | "md" | "lg";
    /** Prevent repeated activation while retaining the action label. @default false */
    loading?: boolean;
    /** Optional approved glyph before the label. */
    leading?: ReactNode;
    ref?: Ref<HTMLButtonElement>;
  };

/** Render a native button with Klein appearance and safe form defaults. */
export function Button({
  variant = "primary",
  tone,
  size = "md",
  loading = false,
  disabled,
  children,
  leading,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className="k-button"
      data-variant={variant}
      data-tone={tone ?? (variant === "text" ? "accent" : "neutral")}
      data-size={size}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {leading && (
        <span aria-hidden="true" className="k-button-leading">
          {leading}
        </span>
      )}
      {children}
    </button>
  );
}

/** Decorative glyph. Its parent supplies accessible meaning. */
export interface IconProps {
  /** Glyph names are a closed, reviewed set. */
  name:
    | "chevron-down"
    | "chevron-left"
    | "chevron-right"
    | "arrow-right"
    | "search"
    | "check";
}
/** Draw the Klein reference glyphs with square caps and mitre joins. */
export function Icon({ name }: IconProps) {
  const paths = {
    "chevron-down": "M2 4 5.5 7.5 9 4",
    "chevron-left": "M7 2 3.5 5.5 7 9",
    "chevron-right": "M4 2 7.5 5.5 4 9",
    "arrow-right": "M1 5.5h8M6 2l3.5 3.5L6 9",
    search: "m7.5 7.5 2.5 2.5",
    check: "m1 5 3 3 5-6",
  };
  return (
    <svg
      className="k-icon"
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "check" ? 1.625 : 1.238}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {name === "search" && <circle cx="4.5" cy="4.5" r="3.25" />}
      <path d={paths[name]} />
    </svg>
  );
}

/** An icon-only action with a required accessible name. */
export type IconButtonProps = Omit<
  NativeButton,
  "aria-label" | "aria-labelledby"
> & {
  /** Describes the action, not the icon shape. */
  label: string;
  /** Approved glyph. */
  icon: IconProps["name"];
  /** Control height and width. @default md */
  size?: "sm" | "md" | "lg";
  ref?: Ref<HTMLButtonElement>;
};
/** Render an accessible compact action. */
export function IconButton({
  label,
  icon,
  size = "md",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className="k-button k-icon-button"
      data-variant="tertiary"
      data-size={size}
      aria-label={label}
    >
      <Icon name={icon} />
    </button>
  );
}
