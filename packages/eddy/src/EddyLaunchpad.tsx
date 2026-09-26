"use client";
import { Button, Icon } from "@klein-ui/react";
import { EddyIcon } from "./EddyIcon.js";
export interface EddyLaunchpadProps {
  /** Controlled question draft. */
  value: string;
  /** Receives draft changes; persistence belongs to the application. */
  onValueChange: (value: string) => void;
  /** Submit intent; application owns sending, clearing and rail navigation. */
  onSubmit: () => void;
  /** Only groups and suggestions the viewer is permitted to use. */
  groups: readonly {
    id: string;
    label: string;
    suggestions: readonly { id: string; label: string }[];
  }[];
  /** Stable suggestion identity; no routing or permission decisions occur here. */
  onSuggestionSelect: (id: string) => void;
  /** Localized labels and permission explanation. */
  labels: {
    title: string;
    placeholder: string;
    scope: string;
    send: string;
    suggestions: string;
    permission: string;
  };
}
const CURRENTS = [
  {
    c: "c1",
    d: "M0 30 C 100 12, 200 48, 300 30 S 500 12, 600 30 S 800 48, 900 30 S 1100 12, 1200 30 S 1400 48, 1500 30 S 1700 12, 1800 30",
  },
  {
    c: "c2",
    d: "M0 58 C 120 40, 240 76, 360 58 S 600 40, 720 58 S 960 76, 1080 58 S 1320 40, 1440 58 S 1680 76, 1800 58",
  },
  {
    c: "c3",
    d: "M0 86 C 90 70, 180 102, 270 86 S 450 70, 540 86 S 720 102, 810 86 S 990 70, 1080 86 S 1260 102, 1350 86 S 1530 70, 1620 86 S 1800 102, 1890 86",
  },
  {
    c: "c4",
    d: "M0 112 C 140 98, 280 126, 420 112 S 700 98, 840 112 S 1120 126, 1260 112 S 1540 98, 1680 112 S 1960 126, 2100 112",
  },
] as const;

/** Question launchpad with grouped prompts and the Eddy current illustration. */
export function EddyLaunchpad({
  value,
  onValueChange,
  onSubmit,
  groups,
  onSuggestionSelect,
  labels,
}: EddyLaunchpadProps) {
  return (
    <div
      className="flex h-full justify-center overflow-y-auto px-6 pt-11 pb-14"
      data-testid="eddy-landing"
    >
      {/* The panel. Klein blue, white on it, currents across the top. Centred at
          the mockup's width — a hero, not a list, so the gutter rule's full-bleed
          does not apply here. */}
      <div className="bg-klein-600 relative w-full max-w-[880px] overflow-hidden text-white">
        <div className="eddy-currents" aria-hidden="true">
          <svg viewBox="0 0 1600 132" preserveAspectRatio="none">
            {CURRENTS.map((current) => (
              <path key={current.c} className={current.c} d={current.d} />
            ))}
          </svg>
        </div>

        <div className="relative z-[2] px-5 sm:px-11 pt-[46px] pb-9">
          <div className="flex items-center gap-3">
            <EddyIcon className="h-7 w-7 text-white" />
            <h1 className="text-[26px] leading-none font-semibold tracking-[-0.02em]">
              {labels.title}
            </h1>
          </div>

          {/* ── The ask box: paper, set into the blue ── */}
          <div
            className="bg-background border-klein-800 mt-6 border"
            data-testid="eddy-ask"
          >
            <textarea
              aria-label={labels.placeholder}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  if (value.trim()) onSubmit();
                }
              }}
              rows={3}
              placeholder={labels.placeholder}
              className="text-foreground min-h-0 resize-none border-0 bg-transparent px-[15px] pt-3.5 pb-1 text-[14.5px] leading-normal shadow-none focus-visible:ring-0"
              data-testid="eddy-ask-input"
            />
            <div className="flex items-center gap-2 py-2 pr-2.5 pl-[15px]">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[11.5px]">
                {labels.scope}
              </span>
              <div className="flex-1" />
              <Button
                size="sm"
                tone="accent"
                onClick={() => onSubmit()}
                disabled={value.trim().length === 0}
                data-testid="eddy-ask-send"
              >
                {labels.send}
                <Icon name="arrow-right" />
              </Button>
            </div>
          </div>

          {/* ── Where to start ── */}
          {groups.length > 0 ? (
            <div data-testid="eddy-suggestions">
              <div className="mt-[26px] text-[10.5px] font-semibold tracking-[0.06em] text-white/60 uppercase">
                {labels.suggestions}
              </div>
              <div className="grid grid-cols-1 gap-x-[22px] md:grid-cols-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="mt-3.5"
                    data-testid={`eddy-group-${group.id}`}
                  >
                    <div className="mb-1.5 text-[11px] font-semibold tracking-[0.04em] text-white/55 uppercase">
                      {group.label}
                    </div>
                    {group.suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => onSuggestionSelect(suggestion.id)}
                        className="mb-1.5 flex w-full items-center gap-2 border border-white/20 px-3 py-[9px] text-left text-[13.5px] text-white transition-colors hover:border-white/45 hover:bg-white/10"
                        data-testid="eddy-suggestion"
                      >
                        <span className="min-w-0 flex-1">
                          {suggestion.label}
                        </span>
                        <Icon name="arrow-right" />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* ── What Eddy will and won't do ── */}
          <div className="mt-[30px] flex items-baseline gap-2 border-t border-white/[0.18] pt-3.5 text-xs text-white/60">
            <span aria-hidden="true">⌾</span>
            <span>{labels.permission}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
