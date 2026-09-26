import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "./utils.js";

export const COST_CENTER_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#14B8A6", // Teal
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#6B7280", // Gray (default)
] as const;

export type CostCenterColor = (typeof COST_CENTER_COLORS)[number];

interface ColorSwatchProps {
  color: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

export function ColorSwatch({
  color,
  selected,
  onClick,
  size = "md",
}: ColorSwatchProps) {
  const sizeClasses = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  const checkSize = size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center",
        sizeClasses,
        selected
          ? "border-stone-900 ring-2 ring-offset-2 ring-stone-400"
          : "border-white/50",
      )}
      style={{ backgroundColor: color }}
      title={color}
    >
      {selected && (
        <Check className={cn(checkSize, "text-white drop-shadow-md")} />
      )}
    </button>
  );
}

interface ColorSwatchGroupProps {
  value: string;
  onChange: (color: string) => void;
  colors?: readonly string[];
  size?: "sm" | "md";
}

export function ColorSwatchGroup({
  value,
  onChange,
  colors = COST_CENTER_COLORS,
  size = "md",
}: ColorSwatchGroupProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map((color) => (
        <ColorSwatch
          key={color}
          color={color}
          selected={value === color}
          onClick={() => onChange(color)}
          size={size}
        />
      ))}
    </div>
  );
}
