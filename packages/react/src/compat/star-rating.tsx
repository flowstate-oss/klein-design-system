import { cn } from "./utils.js";
import { Star } from "lucide-react";
import * as React from "react";

export interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
  label?: string;
  precision?: number;
  className?: string;
}

const StarRating = React.forwardRef<HTMLDivElement, StarRatingProps>(
  (
    {
      value = 0,
      onChange,
      max = 5,
      size = "md",
      readonly = false,
      showValue = false,
      label,
      className,
    },
    ref,
  ) => {
    const [hoverValue, setHoverValue] = React.useState<number | null>(null);
    const [isFocused, setIsFocused] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const normalizedValue = Math.max(0, Math.min(1, value));
    const displayValue = hoverValue !== null ? hoverValue : normalizedValue;

    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    const handleClick = (starIndex: number) => {
      if (readonly || !onChange) return;

      const newValue = (starIndex + 1) / max;

      if (Math.abs(normalizedValue - newValue) < 0.01) {
        onChange(0);
      } else {
        onChange(newValue);
      }
    };

    const handleMouseEnter = (starIndex: number) => {
      if (readonly || !onChange) return;
      const newValue = (starIndex + 1) / max;
      setHoverValue(newValue);
    };

    const handleMouseLeave = () => {
      setHoverValue(null);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (readonly || !onChange) return;

      const currentStars = Math.round(normalizedValue * max);
      let newStars = currentStars;

      switch (event.key) {
        case "ArrowLeft":
        case "ArrowDown":
          event.preventDefault();
          newStars = Math.max(0, currentStars - 1);
          break;
        case "ArrowRight":
        case "ArrowUp":
          event.preventDefault();
          newStars = Math.min(max, currentStars + 1);
          break;
        case "Home":
          event.preventDefault();
          newStars = 0;
          break;
        case "End":
          event.preventDefault();
          newStars = max;
          break;
        case " ":
        case "Enter":
          event.preventDefault();
          newStars = currentStars > 0 ? 0 : 3;
          break;
        default:
          return;
      }

      const newValue = newStars / max;
      onChange(newValue);
    };

    const getProficiencyText = (rating: number): string => {
      const stars = Math.round(rating * max);
      switch (stars) {
        case 0:
          return "Not Rated";
        case 1:
          return "Beginner";
        case 2:
          return "Intermediate";
        case 3:
          return "Proficient";
        case 4:
          return "Advanced";
        case 5:
          return "Expert";
        default:
          return "Not Rated";
      }
    };

    const stars = Array.from({ length: max }, (_, i) => {
      const fillPercentage = Math.max(
        0,
        Math.min(100, (displayValue * max - i) * 100),
      );

      return (
        <div
          key={i}
          className="relative cursor-pointer"
          onClick={() => handleClick(i)}
          onMouseEnter={() => handleMouseEnter(i)}
          role="button"
          aria-label={`Rate ${i + 1} out of ${max} stars`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              "text-muted-foreground/20",
              readonly && "cursor-default",
            )}
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${fillPercentage}%` }}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "fill-current text-yellow-500",
                readonly && "cursor-default",
              )}
            />
          </div>
        </div>
      );
    });

    return (
      <div ref={ref} className={cn("flex flex-col gap-1", className)}>
        {label && (
          <label className="text-foreground text-sm font-medium">{label}</label>
        )}
        <div
          ref={containerRef}
          className={cn(
            "flex items-center gap-0.5",
            !readonly &&
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            isFocused && "ring-ring ring-2 ring-offset-2",
          )}
          onMouseLeave={handleMouseLeave}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          tabIndex={readonly ? -1 : 0}
          role="slider"
          aria-label={label || "Star rating"}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={normalizedValue}
          aria-valuetext={`${Math.round(normalizedValue * max)} out of ${max} stars - ${getProficiencyText(normalizedValue)}`}
          aria-readonly={readonly}
        >
          {stars}
          {showValue && (
            <span className={cn("text-muted-foreground ml-2 text-sm")}>
              {getProficiencyText(displayValue)}
            </span>
          )}
        </div>
      </div>
    );
  },
);

StarRating.displayName = "StarRating";

export { StarRating };
