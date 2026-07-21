import { cn } from "@/lib/utils";
import type { SignalRConnectionState } from "@/services/signalr/events";

const labels: Record<SignalRConnectionState, string> = {
  disconnected: "Disconnected",
  connecting: "Connecting…",
  connected: "Live",
  reconnecting: "Reconnecting…",
  failed: "Connection failed",
};

const styles: Record<SignalRConnectionState, string> = {
  disconnected: "bg-muted/20 text-muted",
  connecting: "bg-warning/15 text-warning",
  connected: "bg-success/15 text-success",
  reconnecting: "bg-warning/15 text-warning",
  failed: "bg-error/15 text-error",
};

export function ConnectionStatus({
  state = "disconnected",
  className,
}: {
  state?: SignalRConnectionState;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        styles[state],
        className,
      )}
    >
      {labels[state]}
    </span>
  );
}
