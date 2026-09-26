"use client";

import React, { useRef, useEffect, useState } from "react";

interface DataRowContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Responsive container for DataRow components.
 * Monitors its own width and sets a `data-prop-slots` attribute to control
 * which properties are visible based on available space.
 *
 * Breakpoints:
 * - < 450px: "0" (Hide all properties)
 * - 450-599px: "1" (Show only priority 4+)
 * - 600-799px: "2" (Show priority 3+)
 * - 800-999px: "3" (Show priority 2+)
 * - >= 1000px: "4" (Show all)
 */
export function DataRowContainer({
  children,
  className,
  ...props
}: DataRowContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<string>("4");

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        let newSlots = "4";

        if (width < 450) {
          newSlots = "0";
        } else if (width < 600) {
          newSlots = "1";
        } else if (width < 800) {
          newSlots = "2";
        } else if (width < 1000) {
          newSlots = "3";
        }

        // Only update if changed to avoid re-renders (though state setter handles this too)
        setSlots(newSlots);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      data-prop-slots={slots}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
