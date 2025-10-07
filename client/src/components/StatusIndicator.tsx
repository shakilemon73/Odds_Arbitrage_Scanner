import { cn } from "@/lib/utils";

type StatusType = "connected" | "disconnected" | "cached";

interface StatusIndicatorProps {
  status: StatusType;
  className?: string;
}

export default function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const statusConfig = {
    connected: {
      color: "bg-emerald-500 dark:bg-emerald-400",
      label: "Live",
      pulse: true,
      ariaLabel: "Connected to live data",
    },
    disconnected: {
      color: "bg-red-500 dark:bg-red-400",
      label: "Offline",
      pulse: false,
      ariaLabel: "Disconnected from data source",
    },
    cached: {
      color: "bg-amber-500 dark:bg-amber-400",
      label: "Cached",
      pulse: false,
      ariaLabel: "Showing cached data",
    },
  };

  const config = statusConfig[status];

  return (
    <div 
      className={cn("flex items-center gap-2", className)} 
      data-testid={`status-${status}`}
      role="status"
      aria-label={config.ariaLabel}
    >
      <div className="relative" aria-hidden="true">
        <div className={cn("h-2 w-2 rounded-full", config.color)} />
        {config.pulse && (
          <div className={cn("absolute inset-0 h-2 w-2 rounded-full animate-ping opacity-75", config.color)} />
        )}
      </div>
      <span className="text-sm text-muted-foreground">{config.label}</span>
    </div>
  );
}
