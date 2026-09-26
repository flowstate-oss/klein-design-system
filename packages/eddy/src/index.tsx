"use client";
import {
  useEffect,
  useRef,
  type ReactNode,
  type DragEventHandler,
} from "react";
import Markdown from "react-markdown";
import { Button } from "@klein-ui/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@klein-ui/react/compat/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@klein-ui/react/compat/dialog";
export { EddyIcon } from "./EddyIcon.js";
export type { EddyIconProps } from "./EddyIcon.js";
import { EddyIcon } from "./EddyIcon.js";

/** Controlled composer. The application owns draft persistence, chat creation and sending. */
export interface EddyComposerProps {
  value: string;
  onValueChange: (next: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  label: string;
  placeholder?: string;
  hint?: string;
  sendLabel: string;
}
export function EddyComposer({
  value,
  onValueChange,
  onSubmit,
  loading = false,
  label,
  placeholder,
  hint,
  sendLabel,
}: EddyComposerProps) {
  return (
    <div className="k-eddy-composer">
      <div className="k-eddy-compose-row">
        <textarea
          aria-label={label}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing &&
              e.keyCode !== 229
            ) {
              e.preventDefault();
              if (value.trim() && !loading) onSubmit();
            }
          }}
          placeholder={placeholder}
          disabled={loading}
          rows={1}
        />
        <Button
          tone="accent"
          disabled={!value.trim()}
          loading={loading}
          onClick={onSubmit}
        >
          {sendLabel}
        </Button>
      </div>
      {hint && <p>{hint}</p>}
    </div>
  );
}
/** Explicit message states; renderers never infer errors from prose or run tools. */
export interface EddyMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  status: "queued" | "streaming" | "complete" | "error" | "cancelled";
  steps?: readonly string[];
  thinkingLabel: string;
  retryLabel: string;
  retrying?: boolean;
  onRetry?: () => void;
  suggestion?: string;
  onSuggestion?: (value: string) => void;
  chart?: ReactNode;
}
export function EddyMessage({
  role,
  content,
  status,
  steps = [],
  thinkingLabel,
  retryLabel,
  retrying,
  onRetry,
  suggestion,
  onSuggestion,
  chart,
}: EddyMessageProps) {
  const pending = status === "streaming" || status === "queued";
  return (
    <article className="k-eddy-message" data-role={role} data-status={status}>
      {role === "assistant" && <EddyIcon variant="tile" />}
      <div className="k-eddy-message-body">
        {pending && steps.length > 0 && (
          <ol className="k-eddy-steps">
            {steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        )}
        {pending && !content ? (
          <p role="status">{thinkingLabel}</p>
        ) : (
          <Markdown
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </Markdown>
        )}
        {suggestion && onSuggestion && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSuggestion(suggestion)}
          >
            {suggestion}
          </Button>
        )}
        {status === "error" && onRetry && (
          <Button
            variant="secondary"
            size="sm"
            loading={retrying}
            onClick={onRetry}
          >
            {retryLabel}
          </Button>
        )}
        {chart}
      </div>
    </article>
  );
}
/** Scroll ownership is presentation state. Incoming content does not pull readers away from history. */
export interface EddyConversationProps {
  children: ReactNode;
  label?: string;
}
export function EddyConversation({
  children,
  label = "Conversation",
}: EddyConversationProps) {
  const ref = useRef<HTMLDivElement>(null),
    following = useRef(true);
  useEffect(() => {
    if (following.current && ref.current)
      ref.current.scrollTop = ref.current.scrollHeight;
  }, [children]);
  return (
    <div
      className="k-eddy-conversation"
      ref={ref}
      role="log"
      aria-label={label}
      aria-live="polite"
      aria-relevant="additions"
      onScroll={() => {
        const node = ref.current;
        if (node)
          following.current =
            node.scrollHeight - node.clientHeight - node.scrollTop < 40;
      }}
    >
      {children}
    </div>
  );
}
/** Application-supplied chat history, with timestamps already formatted in the user's locale. */
export interface EddyHistoryProps {
  items: readonly {
    id: string;
    title: string;
    updatedLabel?: string;
    disabled?: boolean;
  }[];
  value: string | null;
  onValueChange: (id: string) => void;
  label: string;
  footer?: string;
}
export function EddyHistory({
  items,
  value,
  onValueChange,
  label,
  footer,
}: EddyHistoryProps) {
  if (!items.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="tertiary" size="sm">
          {items.find((item) => item.id === value)?.title ?? label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) onValueChange(item.id);
            }}
          >
            <div className="k-eddy-history-item">
              <span>{item.title}</span>
              {item.updatedLabel && <small>{item.updatedLabel}</small>}
            </div>
          </DropdownMenuItem>
        ))}
        {footer && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>{footer}</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
/** Rail/full-page chrome; no chat IDs, permissions or network state. */
export interface EddyPanelProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}
export function EddyPanel({
  title,
  description,
  actions,
  children,
}: EddyPanelProps) {
  return (
    <section className="k-eddy-panel">
      <header>
        <EddyIcon variant="tile" />
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <div className="k-eddy-panel-actions">{actions}</div>
      </header>
      <div className="k-eddy-panel-content">{children}</div>
    </section>
  );
}
/** A rendered chart preview. Data loading, report creation and drag payloads remain in the app. */
export interface EddyChartPreviewProps {
  title: string;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  compact: ReactNode;
  expanded: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  onDragStart?: DragEventHandler<HTMLElement>;
}
export function EddyChartPreview({
  title,
  open,
  onOpenChange,
  compact,
  expanded,
  actions,
  footer,
  onDragStart,
}: EddyChartPreviewProps) {
  return (
    <>
      <section
        className="k-eddy-chart-preview"
        draggable={Boolean(onDragStart)}
        onDragStart={onDragStart}
      >
        <Button variant="text" onClick={() => onOpenChange(true)}>
          {title}
        </Button>
        <div className="k-eddy-chart-compact">{compact}</div>
      </section>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {actions}
          </DialogHeader>
          <div className="k-eddy-chart-expanded">{expanded}</div>
          {footer}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Persistent rail shell. The application decides when to mount its connected conversation. */
export interface EddyRailProps {
  open: boolean;
  children: ReactNode;
}
export function EddyRail({ open, children }: EddyRailProps) {
  return (
    <aside
      className="k-eddy-rail"
      data-open={open}
      data-assistant-rail=""
      aria-hidden={!open}
      inert={!open}
    >
      {children}
    </aside>
  );
}

export {EddyLaunchpad,type EddyLaunchpadProps} from './EddyLaunchpad.js';
