import { cn } from "@klein-ui/react/compat/utils";

/**
 * Eddy's mark: three three-quarter circles turning into a vortex.
 *
 * Drawn from the supplied brand SVG (`gemini-svg.svg`): radii 60 / 40 / 20 on
 * a 200-unit canvas, each rotated a third of a turn from the last, stroked at
 * 12 with round caps. Kept as inline paths rather than an `<img>` so it takes
 * `currentColor` and sits in a Lucide-sized slot like every other glyph in the
 * sidebar, header and rail.
 */
const VORTEX_PATHS = [
  { d: "M 100 40 A 60 60 0 1 1 40 100", rotate: 0 },
  { d: "M 100 60 A 40 40 0 1 1 60 100", rotate: 120 },
  { d: "M 100 80 A 20 20 0 1 1 80 100", rotate: 240 },
] as const;

/** International Klein Blue — the brand tile behind the mark. */
const KLEIN_BLUE = "#002FA7";

/**
 * The mark's own bounding box on the 200-unit canvas: the outer arc reaches
 * radius 60 from the centre (100, 100), plus half the 12-unit stroke, so the
 * ink spans 34 → 166 on both axes. The `mark` variant crops to this box so the
 * vortex fills a Lucide-sized slot the way every other glyph does — drawn on
 * the tile's full 200-unit canvas it filled only ~60% of a 16px slot and read
 * as a dot in the sidebar and header. The `tile` variant keeps the full canvas:
 * the mark sitting inside the square, with air around it, IS the brand tile.
 */
const MARK_VIEWBOX = "34 34 132 132";
const TILE_VIEWBOX = "0 0 200 200";

export interface EddyIconProps {
  className?: string;
  /**
   * `mark` — the vortex alone in `currentColor`, for icon slots.
   * `tile` — the vortex in white on the Klein-blue square, for an avatar or a
   *   place where the mark has to stand on its own.
   */
  variant?: "mark" | "tile";
  /** Accessible name. Omit when the icon sits beside its own label. */
  title?: string;
}

/**
 * Render Eddy's mark.
 *
 * @param props - See {@link EddyIconProps}.
 * @returns An inline SVG sized by `className` (defaults to a 4×4 Lucide slot).
 */
export function EddyIcon({
  className,
  variant = "mark",
  title,
}: EddyIconProps): React.JSX.Element {
  return (
    <svg
      viewBox={variant === "tile" ? TILE_VIEWBOX : MARK_VIEWBOX}
      className={cn("h-4 w-4 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      data-testid="eddy-icon"
    >
      {title ? <title>{title}</title> : null}
      {variant === "tile" ? (
        <rect width="200" height="200" fill={KLEIN_BLUE} />
      ) : null}
      <g
        fill="none"
        stroke={variant === "tile" ? "#FFFFFF" : "currentColor"}
        strokeWidth={12}
        strokeLinecap="round"
      >
        {VORTEX_PATHS.map((path) => (
          <path
            key={path.rotate}
            d={path.d}
            transform={
              path.rotate === 0 ? undefined : `rotate(${path.rotate} 100 100)`
            }
          />
        ))}
      </g>
    </svg>
  );
}
