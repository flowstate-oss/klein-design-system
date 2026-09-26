import type { ReactNode } from "react";
export interface NoticeProps {
  /** Short description of the condition. */
  title: string;
  /** Supporting explanation or recovery instructions. */
  children?: ReactNode;
  /** Meaning supplied by the application. */
  tone?: "neutral" | "good" | "watch" | "bad";
  /** Announce a newly occurring urgent error; static notices are not live by default. */
  urgent?: boolean;
  /** Optional recovery action using canonical controls. */
  actions?: ReactNode;
}
/** Inline feedback with consistent semantic colors and flat geometry. */
export function Notice({
  title,
  children,
  tone = "neutral",
  urgent = false,
  actions,
}: NoticeProps) {
  return (
    <section
      className="k-notice"
      data-tone={tone}
      role={urgent ? "alert" : undefined}
      aria-label={title}
    >
      <strong>{title}</strong>
      {children && <div>{children}</div>}
      {actions && <div className="k-actions">{actions}</div>}
    </section>
  );
}
