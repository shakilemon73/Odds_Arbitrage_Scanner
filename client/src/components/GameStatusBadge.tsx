import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Radio, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGameStatus, getTimeUntilStart } from "@/lib/timeUtils";
import type { GameStatus } from "@shared/schema";

interface GameStatusBadgeProps {
  commenceTime?: string;
  className?: string;
}

export default function GameStatusBadge({ commenceTime, className }: GameStatusBadgeProps) {
  const [timeString, setTimeString] = useState(() => getTimeUntilStart(commenceTime));
  const [status, setStatus] = useState<GameStatus>(() => getGameStatus(commenceTime));

  useEffect(() => {
    // Update every 10 seconds
    const interval = setInterval(() => {
      setTimeString(getTimeUntilStart(commenceTime));
      setStatus(getGameStatus(commenceTime));
    }, 10000);

    return () => clearInterval(interval);
  }, [commenceTime]);

  // If no commence time, show a muted badge
  if (!commenceTime) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 !h-7 border-2 bg-muted/30 text-muted-foreground border-muted",
          className
        )}
        data-testid="badge-status-unknown"
      >
        <Clock className="h-3 w-3" />
        <span className="text-xs font-semibold">Time TBA</span>
      </Badge>
    );
  }

  // Live games - red badge
  if (status === "live") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 !h-7 border-2 bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40 animate-pulse",
          className
        )}
        data-testid="badge-status-live"
      >
        <Radio className="h-3 w-3" />
        <span className="text-xs font-bold uppercase">{timeString}</span>
      </Badge>
    );
  }

  // Starting soon - orange/amber badge
  if (status === "starting-soon") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 !h-7 border-2 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40",
          className
        )}
        data-testid="badge-status-starting-soon"
      >
        <Zap className="h-3 w-3" />
        <span className="text-xs font-bold">STARTING IN {timeString}</span>
      </Badge>
    );
  }

  // Upcoming games - muted badge with countdown
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 !h-7 border-2 bg-muted/30 text-muted-foreground border-muted",
        className
      )}
      data-testid="badge-status-upcoming"
    >
      <Clock className="h-3 w-3" />
      <span className="text-xs font-semibold">Starts in {timeString}</span>
    </Badge>
  );
}
