import { useState } from "react";
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
  Zap,
  Target,
  Percent,
  Wifi,
  Database,
  TestTube,
  LineChart as LineChartIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import LineMovementChart from "./LineMovementChart";

export interface ArbitrageOpportunity {
  id: string;
  sport: string;
  match: string;
  bookmakers: {
    name: string;
    outcome: string;
    odds: number;
    stake: number;
    ev?: number;
    evDollars?: number;
  }[];
  profit: number;
  timestamp: string;
  eventId?: string;
  dataSource?: "live" | "mock" | "cached";
  hold?: number;
  isMiddle?: boolean;
  middleInfo?: {
    isMiddle: boolean;
    line1?: number;
    line2?: number;
    winScenarios?: string[];
  };
  isPositiveEV?: boolean;
  marketType?: "h2h" | "spreads" | "totals";
}

interface ArbitrageCardProps {
  opportunity: ArbitrageOpportunity;
  onClick?: () => void;
}

export default function ArbitrageCard({ opportunity, onClick }: ArbitrageCardProps) {
  const [lineMovementOpen, setLineMovementOpen] = useState(false);
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

  const getDataSourceBadge = () => {
    if (!opportunity.dataSource) return null;
    
    const sourceConfig = {
      live: {
        label: "Live",
        icon: Wifi,
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      },
      mock: {
        label: "Mock",
        icon: TestTube,
        className: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
      },
      cached: {
        label: "Cached",
        icon: Database,
        className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      },
    };

    const config = sourceConfig[opportunity.dataSource];
    const SourceIcon = config.icon;

    return (
      <Badge
        variant="outline"
        className={cn("gap-1.5 !h-7 border-2", config.className)}
        data-testid={`badge-source-${opportunity.dataSource}`}
      >
        <SourceIcon className="h-3 w-3" />
        <span className="text-xs font-semibold">{config.label}</span>
      </Badge>
    );
  };

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
        "border-2 border-card-border hover:border-primary/30"
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
          "absolute inset-0 bg-gradient-to-br opacity-40 dark:opacity-30 transition-opacity duration-300 group-hover:opacity-60",
          profitGradientClass
        )} 
        aria-hidden="true"
      />

      <CardHeader className="relative pb-4 sm:pb-5 space-y-3 sm:space-y-5 p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              "mt-0.5 sm:mt-1 p-2 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0 transition-all duration-300",
              "bg-primary/10 dark:bg-primary/15 group-hover:bg-primary/20 dark:group-hover:bg-primary/25",
              "group-hover:scale-110"
            )}>
              <SportIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
              <h3 className="font-bold text-base sm:text-lg leading-tight tracking-tight" data-testid="text-match">
                {opportunity.match}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold">{opportunity.sport}</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 shrink-0 self-start">
            <div className="flex flex-wrap items-center gap-2">
              {getDataSourceBadge()}
              {/* Task 6: Low Hold Badge */}
              {opportunity.hold !== undefined && opportunity.hold < 2 && (
                <Badge
                  variant="outline"
                  className="gap-1.5 !h-7 border-2 bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30"
                  data-testid="badge-low-hold"
                >
                  <Shield className="h-3 w-3" />
                  <span className="text-xs font-semibold">Low Hold</span>
                </Badge>
              )}
              {/* Task 5: Middle Badge */}
              {opportunity.isMiddle && (
                <Badge
                  variant="outline"
                  className="gap-1.5 !h-7 border-2 bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30"
                  data-testid="badge-middle"
                >
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs font-semibold">Middle</span>
                </Badge>
              )}
              {/* Task 8: +EV Badge - show for high EV */}
              {opportunity.bookmakers.some(b => (b.ev || 0) > 5) && (
                <Badge
                  variant="outline"
                  className="gap-1.5 !h-7 border-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  data-testid="badge-high-ev"
                >
                  <Zap className="h-3 w-3" />
                  <span className="text-xs font-semibold">High +EV</span>
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs text-muted-foreground font-medium tabular-nums" data-testid="text-timestamp">
                {timeAgo()}
              </span>
              {/* Task 6: Show Hold % */}
              {opportunity.hold !== undefined && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className={cn(
                    "text-xs font-semibold tabular-nums",
                    opportunity.hold < 2 ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground"
                  )} data-testid="text-hold">
                    {opportunity.hold.toFixed(2)}% hold
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profit Section - Responsive Layout */}
        <div className={cn(
          "relative rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 transition-all duration-300",
          profitBgClass,
          "group-hover:shadow-lg"
        )}>
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1 sm:gap-1.5">
                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Guaranteed Return
              </p>
              <div className="flex items-baseline gap-2 sm:gap-3">
                <p className={cn(
                  "text-3xl sm:text-4xl font-black tabular-nums tracking-tight",
                  profitTextClass
                )} data-testid="text-profit">
                  {opportunity.profit.toFixed(2)}%
                </p>
                <TrendingUp className={cn("h-5 w-5 sm:h-6 sm:w-6", profitIconClass)} aria-hidden="true" />
              </div>
            </div>
            
            <div className="flex items-baseline justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1 sm:gap-1.5">
                  <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Profit
                </p>
                <p className={cn(
                  "text-2xl sm:text-3xl font-bold tabular-nums",
                  profitTextClass
                )} data-testid="text-profit-amount">
                  ${guaranteedProfit.toFixed(2)}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  Total Stake
                </p>
                <p className="text-base sm:text-lg font-bold tabular-nums text-muted-foreground">
                  ${totalStake.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pt-0 pb-4 sm:pb-6 px-4 sm:px-6 space-y-3 sm:space-y-4">
        {/* Bookmaker Bets */}
        <div className="space-y-2 sm:space-y-3">
          <h4 className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1 sm:gap-1.5 px-1">
            <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Betting Strategy
          </h4>
          <div className="space-y-2">
            {opportunity.bookmakers.map((bookmaker, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4",
                  "p-3 sm:p-4 rounded-lg sm:rounded-xl",
                  "bg-card/50 dark:bg-card/30 border border-border/50",
                  "transition-all duration-200 hover-elevate"
                )}
                data-testid={`bookmaker-bet-${idx}`}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <Badge variant="outline" className="shrink-0 font-semibold text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1">
                    {bookmaker.name}
                  </Badge>
                  <span className="font-semibold text-xs sm:text-sm truncate" data-testid="text-outcome">
                    {bookmaker.outcome}
                  </span>
                </div>

                <div className="flex items-center gap-3 sm:gap-6 shrink-0 justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold">Odds</p>
                    <p className="text-sm sm:text-base font-bold tabular-nums" data-testid="text-odds">
                      {bookmaker.odds.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Task 8: Show +EV% */}
                  {bookmaker.ev !== undefined && bookmaker.ev > 0 && (
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold">EV</p>
                      <p className={cn(
                        "text-sm sm:text-base font-bold tabular-nums",
                        bookmaker.ev > 5 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                      )} data-testid="text-ev">
                        +{bookmaker.ev.toFixed(2)}%
                      </p>
                    </div>
                  )}
                  
                  <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold">Stake</p>
                    <p className="text-sm sm:text-base font-bold tabular-nums" data-testid="text-stake">
                      ${bookmaker.stake.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task 5: Middle Win Scenarios */}
        {opportunity.isMiddle && opportunity.middleInfo?.winScenarios && (
          <div className="p-3 sm:p-4 rounded-lg bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/30">
            <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Middle Opportunity - Win Both Bets!
            </h4>
            <ul className="space-y-1">
              {opportunity.middleInfo.winScenarios.map((scenario, idx) => (
                <li key={idx} className="text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>{scenario}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Indicator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 pt-1 sm:pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-xs sm:text-sm font-semibold group/btn w-full sm:w-auto"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            data-testid="button-view-details"
          >
            View Full Details
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
          
          {opportunity.eventId && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs sm:text-sm font-semibold w-full sm:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                setLineMovementOpen(true);
              }}
              data-testid="button-view-line-movement"
            >
              <LineChartIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              View Line Movement
            </Button>
          )}
        </div>
      </CardContent>

      {/* Line Movement Chart Dialog */}
      {opportunity.eventId && (
        <LineMovementChart
          eventId={opportunity.eventId}
          matchName={opportunity.match}
          open={lineMovementOpen}
          onOpenChange={setLineMovementOpen}
        />
      )}
    </Card>
  );
}
