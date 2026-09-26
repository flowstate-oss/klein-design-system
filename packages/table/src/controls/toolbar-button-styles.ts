/**
 * Shared trigger styling for Table toolbar controls.
 *
 * The "refined" look that matches the app's new vocabulary — the left sidebar
 * nav and the drawer tab system: borderless, 13px, with a subtle accent
 * background on hover and while open, instead of the older bordered ghost
 * button. Composed onto a `<Button variant="ghost" size="sm">` via `cn(...)`;
 * tailwind-merge lets these tokens override the ghost variant's border + text
 * size.
 */
export const toolbarTrigger =
  "h-8 gap-1.5 rounded-md border-transparent px-2 text-[13px] font-normal text-muted-foreground " +
  "hover:border-transparent hover:bg-accent hover:text-foreground " +
  "data-[state=open]:bg-accent data-[state=open]:text-foreground";
