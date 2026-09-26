"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          /* Status left-border accents for toast types */
          success:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-emerald-500",
          error:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-destructive",
          warning:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-amber-500",
          info: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-blue-500",
        },
      }}
      closeButton
      {...props}
    />
  );
};

export { Toaster };
