import type { ReactNode, HTMLAttributes } from "react";
type ElementProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style">;
/** Composable hierarchy geometry for existing domain adapters. */
export function HierarchyFrame({
  children,
  padded = false,
  ...props
}: ElementProps & { children: ReactNode; padded?: boolean }) {
  return (
    <div {...props} className="org-chart" data-padded={padded || undefined}>
      {children}
    </div>
  );
}
export function HierarchyLevel(props: ElementProps) {
  return <ul {...props} className="org-chart-level" />;
}
export function HierarchyNode(props: ElementProps) {
  return <li {...props} className="org-chart-node" />;
}

export function HierarchyAddAction({
  label,
  onClick,
  "data-testid": testId,
  buttonTestId,
}: {
  label: string;
  onClick: () => void;
  "data-testid"?: string;
  buttonTestId?: string;
}) {
  return (
    <div className="k-hierarchy-add-zone" data-testid={testId}>
      <button type="button" onClick={onClick} data-testid={buttonTestId}>
        <span aria-hidden="true">+</span>
        {label}
      </button>
    </div>
  );
}
export function HierarchyDropZone({
  label,
  hint,
  active = false,
  ...props
}: ElementProps & {
  label: string;
  hint?: string;
  active?: boolean;
  ref?: import("react").Ref<HTMLDivElement>;
}) {
  return (
    <div
      {...props}
      className="k-hierarchy-drop-zone"
      data-active={active || undefined}
    >
      <strong>{label}</strong>
      {hint && <span>{hint}</span>}
    </div>
  );
}
