import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
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
      ? "border-l-green-500"
      : profitLevel === "medium"
      ? "border-l-yellow-500"
      : "border-l-gray-400";

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

  return (
    <Card
      className={cn("border-l-4 hover-elevate cursor-pointer", borderColor)}
      onClick={onClick}
      data-testid={`card-opportunity-${opportunity.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="material-icons text-muted-foreground">{getSportIcon(opportunity.sport)}</span>
            <h3 className="font-medium text-sm truncate" data-testid="text-match">
              {opportunity.match}
            </h3>
          </div>
          <Badge
            variant="default"
            className={cn(
              "shrink-0",
              profitLevel === "high" && "bg-green-600 hover:bg-green-700",
              profitLevel === "medium" && "bg-yellow-600 hover:bg-yellow-700"
            )}
            data-testid="badge-profit"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            {opportunity.profit.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2">
          {opportunity.bookmakers.map((bookie, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-sm"
              data-testid={`bookmaker-${idx}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-medium text-muted-foreground truncate">{bookie.name}</span>
                <span className="text-xs text-muted-foreground">({bookie.outcome})</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono font-medium" data-testid={`odds-${idx}`}>
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

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-muted-foreground" data-testid="text-timestamp">
            {new Date(opportunity.timestamp).toLocaleTimeString()}
          </span>
          <Button variant="ghost" size="sm" data-testid="button-view-details">
            View Details
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
