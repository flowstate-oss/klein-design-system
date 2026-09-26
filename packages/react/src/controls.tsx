"use client";
import type { ReactNode } from "react";
import { Checkbox as CheckboxPrimitive } from "./compat/checkbox.js";
import { Switch as SwitchPrimitive } from "./compat/switch.js";
import {
  Select as SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./compat/select.js";
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./compat/dialog.js";
import {
  Tooltip as TooltipRoot,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "./compat/tooltip.js";
import { Progress as ProgressPrimitive } from "./compat/progress.js";
import {
  Avatar as AvatarRoot,
  AvatarImage,
  AvatarFallback,
} from "./compat/avatar.js";
import { Textarea as TextareaPrimitive } from "./compat/textarea.js";
/** Controlled selection with an explicit accessible name. */
export interface CheckboxProps {
  label: string;
  value: boolean | "indeterminate";
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}
export function Checkbox({
  label,
  value,
  onValueChange,
  disabled,
}: CheckboxProps) {
  return (
    <label className="k-choice">
      <CheckboxPrimitive
        checked={value}
        onCheckedChange={(next) => onValueChange(next === true)}
        disabled={disabled}
      />
      <span>{label}</span>
    </label>
  );
}
/** An immediate binary setting; persistence belongs to the caller. */
export interface SwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}
export function Switch({ label, value, onValueChange, disabled }: SwitchProps) {
  return (
    <label className="k-choice">
      <SwitchPrimitive
        checked={value}
        onCheckedChange={onValueChange}
        disabled={disabled}
      />
      <span>{label}</span>
    </label>
  );
}
/** Choose one value from a finite, already translated list. */
export interface SelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  disabled?: boolean;
}
export function Select({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
}: SelectProps) {
  return (
    <SelectRoot value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
/** Controlled multiline text. The application owns validation and submission. */
export interface TextareaProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
}
export function Textarea({
  label,
  value,
  onValueChange,
  ...props
}: TextareaProps) {
  return (
    <TextareaPrimitive
      {...props}
      aria-label={label}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    />
  );
}
/** Modal state is controlled; Radix provides focus containment, dismissal and focus restoration. */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: DialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </DialogRoot>
  );
}
/** Supplemental help for an existing focusable control. Do not put essential instructions here. */
export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}
export function Tooltip({ content, children }: TooltipProps) {
  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}
/** Display a supplied percent, clamped to the visual range 0–100. */
export interface ProgressProps {
  label: string;
  value: number;
}
export function Progress({ label, value }: ProgressProps) {
  return (
    <ProgressPrimitive
      aria-label={label}
      value={Math.max(0, Math.min(100, value))}
    />
  );
}
/** Identity image with supplied fallback initials; no user lookup. */
export interface AvatarProps {
  label: string;
  src?: string;
  initials: string;
}
export function Avatar({ label, src, initials }: AvatarProps) {
  return (
    <AvatarRoot aria-label={label}>
      {src && <AvatarImage src={src} alt={label} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </AvatarRoot>
  );
}
/** A read-only semantic status. Use buttons for actions. */
export interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "accent" | "good" | "watch" | "bad";
}
export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span className="k-badge" data-tone={tone}>
      {children}
    </span>
  );
}
