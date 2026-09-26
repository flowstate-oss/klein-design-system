import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./compat/card.js";
/** Shared plot frame. Flat panels fit edge-to-edge bands; panel appearance stands alone. */
export interface ChartPanelProps {
  title?: ReactNode;
  appearance?: "flat" | "panel";
  children: ReactNode;
}
export function ChartPanel({
  title,
  appearance = "flat",
  children,
}: ChartPanelProps) {
  if (appearance === "flat")
    return (
      <div className="flex min-w-0 flex-col p-4">
        {title != null && (
          <div className="text-muted-foreground truncate pb-3 text-[11px] font-medium tracking-wider uppercase">
            {title}
          </div>
        )}
        <div className="min-w-0">{children}</div>
      </div>
    );
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">{children}</CardContent>
    </Card>
  );
}
