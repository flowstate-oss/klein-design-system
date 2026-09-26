"use client";
export interface BubbleData {
  skillId: string;
  skillName: string;
  headcount: number;
  delta: number;
  deltaPercent: number;
  tone?: "good" | "bad" | "accent";
  deltaLabel?: string;
  radius: number;
  x: number;
  y: number;
}

/**
 * Simple circle packing algorithm
 * Places circles in a spiral pattern
 */
export function packCircles(
  bubbles: Array<{ radius: number; skillId: string }>,
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  if (bubbles.length === 0) return positions;

  // Sort by radius descending (place larger circles first)
  const sorted = [...bubbles].sort((a, b) => b.radius - a.radius);

  const centerX = width / 2;
  const centerY = height / 2;

  // Place first circle in center
  positions.set(sorted[0].skillId, { x: centerX, y: centerY });

  // Place remaining circles using spiral pattern
  let angle = 0;
  let spiralRadius = 0;

  for (let i = 1; i < sorted.length; i++) {
    const bubble = sorted[i];
    let placed = false;
    let attempts = 0;
    const maxAttempts = 500;

    while (!placed && attempts < maxAttempts) {
      // Calculate position on spiral
      spiralRadius += 2;
      angle += 0.5;

      const x = centerX + spiralRadius * Math.cos(angle);
      const y = centerY + spiralRadius * Math.sin(angle);

      // Check if position is valid (not overlapping and within bounds)
      let valid = true;

      // Check bounds
      if (
        x - bubble.radius < 10 ||
        x + bubble.radius > width - 10 ||
        y - bubble.radius < 10 ||
        y + bubble.radius > height - 10
      ) {
        valid = false;
      }

      // Check overlap with placed circles
      if (valid) {
        for (const [placedId, pos] of positions) {
          const placedBubble = sorted.find((b) => b.skillId === placedId);
          if (!placedBubble) continue;

          const dx = x - pos.x;
          const dy = y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = bubble.radius + placedBubble.radius + 4; // 4px padding

          if (dist < minDist) {
            valid = false;
            break;
          }
        }
      }

      if (valid) {
        positions.set(bubble.skillId, { x, y });
        placed = true;
      }

      attempts++;
    }

    // If couldn't place, use fallback position
    if (!placed) {
      positions.set(bubble.skillId, {
        x: centerX + i * 30,
        y: centerY + i * 20,
      });
    }
  }

  return positions;
}

export function BubbleChart({
  scenarioName,
  bubbles,
  width,
  height,
}: {
  scenarioName: string;
  bubbles: BubbleData[];
  width: number;
  height: number;
}) {
  return (
    <div className="flex flex-col">
      <h3 className="mb-2 truncate text-sm font-semibold text-stone-700">
        {scenarioName}
      </h3>
      <div className="bg-background rounded-lg border border-stone-200">
        <svg width={width} height={height} className="overflow-visible">
          {bubbles.map((bubble) => (
            <g
              key={bubble.skillId}
              transform={`translate(${bubble.x}, ${bubble.y})`}
            >
              {/* Circle */}
              <circle
                r={bubble.radius}
                fill={
                  bubble.tone === "good"
                    ? "var(--k-good)"
                    : bubble.tone === "bad"
                      ? "var(--k-bad)"
                      : "var(--k-klein)"
                }
                fillOpacity={0.7}
                stroke={
                  bubble.tone === "good"
                    ? "var(--k-good)"
                    : bubble.tone === "bad"
                      ? "var(--k-bad)"
                      : "var(--k-klein)"
                }
                strokeWidth={2}
              />
              {/* Skill name (only if radius is large enough) */}
              {bubble.radius >= 20 && (
                <text
                  textAnchor="middle"
                  dy="-0.2em"
                  className="pointer-events-none fill-white text-[10px] font-medium"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                >
                  {bubble.skillName.length > 12
                    ? bubble.skillName.slice(0, 10) + "..."
                    : bubble.skillName}
                </text>
              )}
              {/* Headcount */}
              {bubble.radius >= 16 && (
                <text
                  textAnchor="middle"
                  dy={bubble.radius >= 20 ? "1em" : "0.3em"}
                  className="pointer-events-none fill-white text-[10px] font-bold"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                >
                  {bubble.headcount}
                </text>
              )}
              {/* Delta indicator (only if radius is large enough) */}
              {bubble.radius >= 24 && bubble.delta !== 0 && (
                <text
                  textAnchor="middle"
                  dy="2.2em"
                  className="pointer-events-none fill-white text-[8px] opacity-80"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                >
                  {bubble.deltaLabel}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
