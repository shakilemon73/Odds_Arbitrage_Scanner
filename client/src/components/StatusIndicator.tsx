import { cn } from "@/lib/utils";

type StatusType = "connected" | "disconnected" | "cached";

interface StatusIndicatorProps {
  status: StatusType;
  className?: string;
}

export default function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const statusConfig = {
    connected: {
      color: "bg-green-500",
      label: "Live",
      pulse: true,
    },
    disconnected: {
      color: "bg-red-500",
      label: "Offline",
      pulse: false,
    },
    cached: {
      color: "bg-yellow-500",
      label: "Cached",
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid={`status-${status}`}>
      <div className="relative">
        <div className={cn("h-2 w-2 rounded-full", config.color)} />
        {config.pulse && (
          <div className={cn("absolute inset-0 h-2 w-2 rounded-full animate-ping", config.color)} />
        )}
      </div>
      <span className="text-sm text-muted-foreground">{config.label}</span>
    </div>
  );
}
