import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Circle as CircleIcon,
  Trophy,
  Dumbbell,
  Snowflake,
  Shield,
  CircleDot,
  Clock,
  ArrowRight,
  DollarSign,
  Zap
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
    if (sportLower.includes('basketball')) return CircleDot;
    if (sportLower.includes('soccer') || sportLower.includes('football')) return CircleIcon;
    if (sportLower.includes('baseball')) return CircleIcon;
    if (sportLower.includes('hockey')) return Snowflake;
    if (sportLower.includes('mma')) return Dumbbell;
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

  const profitGradientClass = 
    profitLevel === "high"
      ? "from-emerald-500/20 via-emerald-500/10 to-transparent"
      : profitLevel === "medium"
      ? "from-amber-500/20 via-amber-500/10 to-transparent"
      : "from-muted/50 via-muted/25 to-transparent";

  const profitBgClass = 
    profitLevel === "high"
      ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30"
      : profitLevel === "medium"
      ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30"
      : "bg-muted/40 dark:bg-muted/30 border-border/50";

  const profitTextClass =
    profitLevel === "high"
      ? "text-emerald-600 dark:text-emerald-400"
      : profitLevel === "medium"
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";

  const profitIconClass =
    profitLevel === "high"
      ? "text-emerald-500 dark:text-emerald-400"
      : profitLevel === "medium"
      ? "text-amber-500 dark:text-amber-400"
      : "text-muted-foreground";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "border-card-border"
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`${opportunity.match}, ${opportunity.profit.toFixed(2)}% profit, ${getProfitLabel()}`}
      data-testid={`card-opportunity-${opportunity.id}`}
    >
      {/* Gradient Background */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50 dark:opacity-40 transition-opacity duration-300 group-hover:opacity-70",
          profitGradientClass
        )} 
        aria-hidden="true"
      />

      <CardHeader className="relative pb-4 space-y-4">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              "mt-0.5 p-1.5 rounded-lg shrink-0 transition-all duration-200",
              "bg-primary/10 dark:bg-primary/15 group-hover:bg-primary/20 dark:group-hover:bg-primary/25"
            )}>
              <SportIcon className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="font-bold text-base leading-tight" data-testid="text-match">
                {opportunity.match}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">{opportunity.sport}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-full bg-muted/50 dark:bg-muted/30">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-medium text-muted-foreground" data-testid="text-timestamp" aria-label={`Updated ${timeAgo()}`}>
              {timeAgo()}
            </span>
          </div>
        </div>

        {/* Profit Display - Hero Section */}
        <div 
          className={cn(
            "rounded-xl border-2 p-4 backdrop-blur-sm transition-all duration-200",
            "group-hover:scale-[1.01]",
            profitBgClass
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Zap className={cn("h-4 w-4", profitIconClass)} aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Guaranteed Return
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className={cn("text-4xl font-black font-mono tabular-nums tracking-tight", profitTextClass)} data-testid="badge-profit">
                  {opportunity.profit.toFixed(2)}%
                </div>
                <TrendingUp className={cn("h-5 w-5 mb-1", profitIconClass)} aria-hidden="true" />
              </div>
            </div>
            <div className="text-right space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Profit Amount
              </div>
              <div className={cn("text-2xl font-bold font-mono tabular-nums", profitTextClass)}>
                ${guaranteedProfit.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">
                on ${totalStake.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pb-5 space-y-4">
        {/* Bookmakers Section */}
        <div className="space-y-3" aria-label="Bookmaker odds">
          {opportunity.bookmakers.map((bookie, idx) => (
            <div
              key={idx}
              className={cn(
                "relative overflow-hidden rounded-lg p-3 transition-all duration-200",
                "bg-card dark:bg-muted/20 border border-card-border",
                "hover:bg-muted/30 dark:hover:bg-muted/30"
              )}
              data-testid={`bookmaker-${idx}`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                    <span className="font-bold text-sm">{bookie.name}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] font-semibold px-2 py-0.5"
                  >
                    {bookie.outcome}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Odds
                    </div>
                    <div className="text-xl font-bold font-mono tabular-nums" data-testid={`odds-${idx}`}>
                      {bookie.odds.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Stake Required
                    </div>
                    <div className="text-xl font-bold font-mono tabular-nums" data-testid={`stake-${idx}`}>
                      ${bookie.stake.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Section */}
        <div className="pt-3 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Total Investment
            </span>
            <span className="text-lg font-black font-mono tabular-nums">
              ${totalStake.toFixed(2)}
            </span>
          </div>
          
          <Button 
            variant="default"
            size="default"
            className={cn(
              "w-full gap-2 font-bold text-sm h-10",
              "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
            )}
            data-testid="button-view-details"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            aria-label="View detailed breakdown and place bets"
          >
            <DollarSign className="h-4 w-4" />
            View Details & Place Bets
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
