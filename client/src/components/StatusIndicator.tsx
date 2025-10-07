import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StatusType = "connected" | "disconnected" | "cached";

interface StatusIndicatorProps {
  status: StatusType;
  className?: string;
}

export default function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const statusConfig = {
    connected: {
      color: "bg-emerald-500 dark:bg-emerald-400",
      textColor: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
      borderColor: "border-emerald-500/30",
      label: "Live",
      description: "Real-time data",
      Icon: Wifi,
      pulse: true,
      ariaLabel: "Connected to live data",
    },
    disconnected: {
      color: "bg-red-500 dark:bg-red-400",
      textColor: "text-red-700 dark:text-red-400",
      bgColor: "bg-red-500/10 dark:bg-red-500/20",
      borderColor: "border-red-500/30",
      label: "Offline",
      description: "No connection",
      Icon: WifiOff,
      pulse: false,
      ariaLabel: "Disconnected from data source",
    },
    cached: {
      color: "bg-amber-500 dark:bg-amber-400",
      textColor: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
      borderColor: "border-amber-500/30",
      label: "Cached",
      description: "Stored data",
      Icon: Database,
      pulse: false,
      ariaLabel: "Showing cached data",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.Icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-3 py-1.5 gap-2 border-2",
        config.bgColor,
        config.borderColor,
        className
      )}
      data-testid={`status-${status}`}
      role="status"
      aria-label={config.ariaLabel}
    >
      <div className="relative flex items-center" aria-hidden="true">
        <StatusIcon className={cn("h-4 w-4", config.textColor)} />
        {config.pulse && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn("h-4 w-4 rounded-full animate-ping opacity-50", config.color)} />
          </div>
        )}
      </div>
      <div className="flex flex-col items-start">
        <span className={cn("text-sm font-semibold leading-none", config.textColor)}>
          {config.label}
        </span>
        <span className="text-xs text-muted-foreground leading-none mt-0.5">
          {config.description}
        </span>
      </div>
    </Badge>
  );
}
