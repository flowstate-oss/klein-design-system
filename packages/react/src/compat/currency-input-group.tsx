"use client";

import * as React from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "./input-group.js";

/**
 * Get currency symbol from ISO 4217 currency code
 * Examples: USD -> $, GBP -> £, EUR -> €
 */
function getCurrencySymbol(currencyCode: string): string {
  try {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const parts = formatter.formatToParts(0);
    const currencyPart = parts.find((p) => p.type === "currency");
    return currencyPart?.value ?? "$";
  } catch (e) {
    return "$";
  }
}

export interface CurrencyInputGroupProps {
  value: number | string;
  onChange: (value: number) => void;
  currencyCode: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  "aria-invalid"?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

/**
 * Reusable currency input component with symbol prefix
 *
 * @example
 * ```tsx
 * <CurrencyInputGroup
 *   value={budget.amount}
 *   onChange={(value) => setAmount(value)}
 *   currencyCode="USD"
 *   placeholder="Enter amount"
 * />
 * ```
 */
export function CurrencyInputGroup({
  value,
  onChange,
  currencyCode,
  placeholder = "0",
  disabled = false,
  min,
  max,
  step = 1,
  "aria-invalid": ariaInvalid,
  id,
  name,
  className,
}: CurrencyInputGroupProps) {
  const symbol = getCurrencySymbol(currencyCode);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Allow empty string (user is clearing the field)
    if (rawValue === "") {
      onChange(0);
      return;
    }

    // Parse as integer (salaries should be whole numbers)
    const parsed = Math.round(parseFloat(rawValue));

    // Only update if valid number
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <InputGroup className={className}>
      <InputGroupAddon align="inline-start">
        <InputGroupText>{symbol}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        type="number"
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        aria-invalid={ariaInvalid}
      />
    </InputGroup>
  );
}

export { getCurrencySymbol };
