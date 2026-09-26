"use client";
import type { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@klein-ui/react/compat/popover";
import { Button } from "@klein-ui/react/compat/button";
import { Input } from "@klein-ui/react/compat/input";
import { Label } from "@klein-ui/react/compat/label";
import { Slider } from "@klein-ui/react/compat/slider";
import { Loader2, Plus, Users } from "lucide-react";
export interface ForecastAllocationEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceName: string;
  resourceType: string;
  children: ReactNode;
  value: number;
  onValueChange: (value: number) => void;
  creating: boolean;
  onCreatingChange: (value: boolean) => void;
  loading: boolean;
  saving: boolean;
  canCreate: boolean;
  allocationCount: number;
  directAllocations: readonly { id: string }[];
  teamAllocations: readonly {
    id: string;
    teamName?: string | null;
    fte: number;
  }[];
  onSave: (id?: string) => void;
}
/** Reusable slider + number input for FTE values */
function FteSliderInput({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (v: number) => void;
}) {
  return (
    <>
      <div className="flex-1">
        <Slider
          value={[value]}
          onValueChange={([v]) => onValueChange(v)}
          min={0}
          max={1}
          step={0.1}
          className="w-full"
        />
      </div>
      <Input
        type="number"
        aria-label="FTE"
        value={value}
        onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
        min={0}
        max={1}
        step={0.1}
        className="w-16 text-right"
      />
    </>
  );
}

export function ForecastAllocationEditor({
  open,
  onOpenChange,
  resourceName,
  resourceType,
  children,
  value: fteValue,
  onValueChange: setFteValue,
  creating: isCreatingNew,
  onCreatingChange: setIsCreatingNew,
  loading: queryLoading,
  saving: isSaving,
  canCreate,
  allocationCount,
  directAllocations,
  teamAllocations,
  onSave: handleSave,
}: ForecastAllocationEditorProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger className="k-forecast-edit-trigger" aria-label={`Edit ${resourceName} allocation`}>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">{resourceName}</h4>
            <p className="text-muted-foreground text-xs capitalize">
              {resourceType} Allocation
            </p>
          </div>

          {queryLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              {directAllocations.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">
                    Direct Allocations
                  </Label>
                  {directAllocations.map((allocation) => (
                    <div
                      key={allocation.id}
                      className="bg-muted/30 flex items-center gap-2 rounded border p-2"
                    >
                      <FteSliderInput
                        value={fteValue}
                        onValueChange={setFteValue}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSave(allocation.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {teamAllocations.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Users className="h-3 w-3" /> Via Team
                  </Label>
                  {teamAllocations.map((allocation) => (
                    <div
                      key={allocation.id}
                      className="bg-muted/30 flex items-center justify-between rounded border p-2"
                    >
                      <span className="text-sm">{allocation.teamName}</span>
                      <span className="text-sm font-medium">
                        {allocation.fte} FTE
                      </span>
                    </div>
                  ))}
                  <p className="text-muted-foreground text-xs">
                    Edit team allocations in the team settings
                  </p>
                </div>
              )}

              {directAllocations.length === 0 &&
                !isCreatingNew &&
                canCreate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsCreatingNew(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Direct Allocation
                  </Button>
                )}

              {isCreatingNew && (
                <div className="space-y-2">
                  <Label className="text-xs">New Allocation FTE</Label>
                  <div className="flex items-center gap-2">
                    <FteSliderInput
                      value={fteValue}
                      onValueChange={setFteValue}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setIsCreatingNew(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSave()}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {allocationCount === 0 && !isCreatingNew && !canCreate && (
                <p className="text-muted-foreground py-2 text-center text-sm">
                  No allocations found
                </p>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
