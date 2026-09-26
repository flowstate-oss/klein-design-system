"use client";

import { useCallback, useMemo } from "react";
import { Columns3, Check } from "lucide-react";
import { Button } from "@klein-ui/react/compat/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@klein-ui/react/compat/popover";
import { useTableLabels } from "../labels.js";
import { cn } from "@klein-ui/react/compat/utils";
import { toolbarTrigger } from "./toolbar-button-styles.js";

/** Definition of a toggleable property column. */
export interface PropertyDefinition {
  /** Unique identifier for the property. */
  id: string;
  /** Human-readable label shown in the picker. */
  label: string;
  /** Whether this property is visible by default. */
  defaultVisible: boolean;
}

interface PropertyPickerProps {
  /** All available property definitions. */
  properties: PropertyDefinition[];
  /** IDs of currently visible properties. */
  visible: string[];
  /** Callback fired when visibility changes. Receives the updated list of visible IDs. */
  onChange: (visibleIds: string[]) => void;
}

/**
 * Column visibility toggle for list-page toolbars.
 *
 * Renders a toolbar button that opens a popover with a checkbox list of all
 * available properties. Checked items are visible on rows; unchecked items are
 * hidden. A "Reset to defaults" action appears when visibility diverges from
 * the property definitions' defaults.
 */
export function PropertyPicker({
  properties,
  visible,
  onChange,
}: PropertyPickerProps) {
  const tc = useTableLabels();

  const visibleSet = useMemo(() => new Set(visible), [visible]);

  const defaultVisibleIds = useMemo(
    () => properties.filter((p) => p.defaultVisible).map((p) => p.id),
    [properties],
  );

  const isDefault = useMemo(() => {
    const defaultSet = new Set(defaultVisibleIds);
    if (visibleSet.size !== defaultSet.size) return false;
    for (const id of visibleSet) {
      if (!defaultSet.has(id)) return false;
    }
    return true;
  }, [visibleSet, defaultVisibleIds]);

  const handleToggle = useCallback(
    (propertyId: string) => {
      if (visibleSet.has(propertyId)) {
        onChange(visible.filter((id) => id !== propertyId));
      } else {
        onChange([...visible, propertyId]);
      }
    },
    [visible, visibleSet, onChange],
  );

  const handleResetDefaults = useCallback(() => {
    onChange(defaultVisibleIds);
  }, [defaultVisibleIds, onChange]);

  // A view with no toggleable columns (e.g. a pure-chart dashboard hosted by
  // ViewControlPanel) passes no properties — render nothing rather than an
  // empty "Properties" popover ("NO SHIT UI"). Every list page configures ≥1
  // property, so this is a no-op for them.
  if (properties.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={toolbarTrigger}>
          <Columns3 className="h-3.5 w-3.5" />
          {tc("properties")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="flex flex-col py-1">
          {properties.map((property) => {
            const isChecked = visibleSet.has(property.id);
            return (
              <button
                key={property.id}
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
                onClick={() => handleToggle(property.id)}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                    isChecked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input",
                  )}
                >
                  {isChecked && <Check className="h-3 w-3" />}
                </div>
                <span className="truncate">{property.label}</span>
              </button>
            );
          })}
          {!isDefault && (
            <>
              <div className="mx-3 my-1 border-t" />
              <button
                type="button"
                className="px-3 py-1.5 text-center text-xs text-muted-foreground hover:text-foreground"
                onClick={handleResetDefaults}
              >
                {tc("reset.defaults")}
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
