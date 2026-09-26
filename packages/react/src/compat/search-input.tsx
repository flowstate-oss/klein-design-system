"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "./utils.js";

export interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value = "",
      onValueChange,
      placeholder = "Search...",
      className,
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value);
    };

    const handleClear = () => {
      onValueChange?.("");
    };

    return (
      <div className={cn("relative", className)}>
        <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="focus:bg-background h-10 w-full rounded-md border border-transparent bg-stone-100 pr-8 pl-8 text-sm transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="hover:text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-stone-400 focus:outline-none"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
