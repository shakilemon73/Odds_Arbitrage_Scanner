import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ArbitrageOpportunity {
  id: string;
  sport: string;
  match: string;
  bookmakers: {
    name: string;
    outcome: string;
    odds: number;
    stake: number;
  }[];
  profit: number;
  timestamp: string;
}

interface ArbitrageCardProps {
  opportunity: ArbitrageOpportunity;
  onClick?: () => void;
}

export default function ArbitrageCard({ opportunity, onClick }: ArbitrageCardProps) {
  const profitLevel = opportunity.profit >= 3 ? "high" : opportunity.profit >= 1 ? "medium" : "low";
  const borderColor =
    profitLevel === "high"
      ? "border-l-emerald-500"
      : profitLevel === "medium"
      ? "border-l-amber-500"
      : "border-l-muted";

  const profitColor =
    profitLevel === "high"
      ? "bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600"
      : profitLevel === "medium"
      ? "bg-amber-600 dark:bg-amber-500 hover:bg-amber-700 dark:hover:bg-amber-600"
      : "";

  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case "soccer":
        return "sports_soccer";
      case "basketball":
        return "sports_basketball";
      case "tennis":
        return "sports_tennis";
      default:
        return "sports";
    }
  };

  const getProfitLabel = () => {
    if (profitLevel === "high") return "High profit opportunity";
    if (profitLevel === "medium") return "Medium profit opportunity";
    return "Low profit opportunity";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const timeAgo = () => {
    const now = new Date();
    const timestamp = new Date(opportunity.timestamp);
    const seconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return timestamp.toLocaleTimeString();
  };

  return (
    <Card
      className={cn(
        "border-l-4 hover-elevate cursor-pointer transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        borderColor
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`${opportunity.match}, ${opportunity.profit.toFixed(2)}% profit, ${getProfitLabel()}`}
      data-testid={`card-opportunity-${opportunity.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="material-icons text-muted-foreground" aria-hidden="true">
              {getSportIcon(opportunity.sport)}
            </span>
            <h3 className="font-medium text-sm truncate" data-testid="text-match">
              {opportunity.match}
            </h3>
          </div>
          <Badge
            variant={profitLevel === "low" ? "default" : "secondary"}
            className={cn("shrink-0", profitLevel !== "low" && profitColor)}
            data-testid="badge-profit"
            aria-label={getProfitLabel()}
          >
            <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
            <span className="font-mono">{opportunity.profit.toFixed(2)}%</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2" role="list" aria-label="Bookmaker odds">
          {opportunity.bookmakers.map((bookie, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-sm"
              role="listitem"
              data-testid={`bookmaker-${idx}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Circle className="h-1.5 w-1.5 fill-current text-primary" aria-hidden="true" />
                <span className="font-medium text-foreground truncate">{bookie.name}</span>
                <span className="text-xs text-muted-foreground">({bookie.outcome})</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono font-semibold text-foreground" data-testid={`odds-${idx}`}>
                  {bookie.odds.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground w-16 text-right" data-testid={`stake-${idx}`}>
                  ${bookie.stake.toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t gap-2">
        <div className="flex items-center justify-between w-full gap-2">
          <span className="text-xs text-muted-foreground" data-testid="text-timestamp" aria-label={`Updated ${timeAgo()}`}>
            {timeAgo()}
          </span>
          <Button 
            variant="ghost"
            data-testid="button-view-details"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            aria-label="View full details"
            className="h-11 px-4"
          >
            View Details
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
