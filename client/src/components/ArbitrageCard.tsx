import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Circle as CircleIcon,
  Trophy,
  Dumbbell,
  Waves,
  Shield,
  Award,
  Target,
  Clock,
  ArrowRight,
  DollarSign
} from "lucide-react";
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
  
  const getSportIcon = (sport: string) => {
    const sportLower = sport.toLowerCase();
    if (sportLower.includes('basketball')) return Dumbbell;
    if (sportLower.includes('soccer') || sportLower.includes('football')) return CircleIcon;
    if (sportLower.includes('tennis')) return Award;
    if (sportLower.includes('baseball')) return Target;
    if (sportLower.includes('hockey')) return Waves;
    if (sportLower.includes('mma')) return Shield;
    return Trophy;
  };

  const SportIcon = getSportIcon(opportunity.sport);

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

  const totalStake = opportunity.bookmakers.reduce((sum, b) => sum + b.stake, 0);
  const guaranteedProfit = (totalStake * opportunity.profit) / 100;

  const profitBgClass = 
    profitLevel === "high"
      ? "bg-emerald-500/10 dark:bg-emerald-500/20"
      : profitLevel === "medium"
      ? "bg-amber-500/10 dark:bg-amber-500/20"
      : "bg-muted/50";

  const profitTextClass =
    profitLevel === "high"
      ? "text-emerald-700 dark:text-emerald-400"
      : profitLevel === "medium"
      ? "text-amber-700 dark:text-amber-400"
      : "text-muted-foreground";

  const profitBorderClass =
    profitLevel === "high"
      ? "border-emerald-500/30"
      : profitLevel === "medium"
      ? "border-amber-500/30"
      : "border-border";

  return (
    <Card
      className={cn(
        "hover-elevate active-elevate-2 cursor-pointer transition-all duration-200 overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`${opportunity.match}, ${opportunity.profit.toFixed(2)}% profit, ${getProfitLabel()}`}
      data-testid={`card-opportunity-${opportunity.id}`}
    >
      <CardHeader className="pb-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5 shrink-0">
              <SportIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="font-semibold text-base leading-tight" data-testid="text-match">
                {opportunity.match}
              </h3>
              <p className="text-sm text-muted-foreground">{opportunity.sport}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm text-muted-foreground" data-testid="text-timestamp" aria-label={`Updated ${timeAgo()}`}>
              {timeAgo()}
            </span>
          </div>
        </div>

        <div 
          className={cn(
            "rounded-lg border-2 p-4",
            profitBgClass,
            profitBorderClass
          )}
        >
          <div className="flex items-baseline justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className={cn("h-4 w-4", profitTextClass)} aria-hidden="true" />
                <span className="text-sm font-medium text-muted-foreground">Guaranteed Profit</span>
              </div>
              <div className={cn("text-4xl font-bold font-mono tabular-nums", profitTextClass)} data-testid="badge-profit">
                {opportunity.profit.toFixed(2)}%
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Profit Amount</div>
              <div className={cn("text-2xl font-bold font-mono tabular-nums", profitTextClass)}>
                ${guaranteedProfit.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-5 space-y-4">
        <div className="space-y-3" role="list" aria-label="Bookmaker odds">
          {opportunity.bookmakers.map((bookie, idx) => (
            <div
              key={idx}
              className="bg-muted/30 rounded-lg p-3 space-y-2"
              role="listitem"
              data-testid={`bookmaker-${idx}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  <span className="font-semibold text-sm">{bookie.name}</span>
                </div>
                <Badge variant="outline" className="text-xs font-normal">
                  {bookie.outcome}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Odds</div>
                  <div className="text-lg font-bold font-mono tabular-nums" data-testid={`odds-${idx}`}>
                    {bookie.odds.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Stake Required</div>
                  <div className="text-lg font-bold font-mono tabular-nums" data-testid={`stake-${idx}`}>
                    ${bookie.stake.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Total Investment</span>
            <span className="font-bold font-mono tabular-nums">${totalStake.toFixed(2)}</span>
          </div>
          
          <Button 
            variant="default"
            size="default"
            className="w-full gap-2"
            data-testid="button-view-details"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            aria-label="View detailed breakdown and place bets"
          >
            <DollarSign className="h-4 w-4" />
            View Details & Calculate Stakes
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
