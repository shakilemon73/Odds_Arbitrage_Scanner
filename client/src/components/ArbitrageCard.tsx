import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Zap,
  Wifi,
  Database,
  TestTube,
  LineChart as LineChartIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import LineMovementChart from "./LineMovementChart";
import GameStatusBadge from "./GameStatusBadge";
import { isStartingSoon } from "@/lib/timeUtils";

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
  commenceTime?: string;
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
  const startingSoon = isStartingSoon(opportunity.commenceTime);
  
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
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
      },
      mock: {
        label: "Mock",
        icon: TestTube,
        className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800",
      },
      cached: {
        label: "Cached",
        icon: Database,
        className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
      },
    };

    const config = sourceConfig[opportunity.dataSource];
    const SourceIcon = config.icon;

    return (
      <Badge
        variant="outline"
        className={cn("gap-1 text-xs font-medium px-2 py-0.5", config.className)}
        data-testid={`badge-source-${opportunity.dataSource}`}
      >
        <SourceIcon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const profitColor =
    profitLevel === "high"
      ? "text-emerald-600 dark:text-emerald-400"
      : profitLevel === "medium"
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";

  const profitBg =
    profitLevel === "high"
      ? "bg-emerald-50 dark:bg-emerald-950/30"
      : profitLevel === "medium"
      ? "bg-amber-50 dark:bg-amber-950/30"
      : "bg-muted/50";

  return (
    <Card
      className={cn(
        "border-0 shadow-sm hover:shadow-md hover-elevate active-elevate-2 cursor-pointer transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        startingSoon && "ring-2 ring-primary/50"
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`${opportunity.match}, ${opportunity.profit.toFixed(2)}% profit, ${getProfitLabel()}`}
      data-testid={`card-opportunity-${opportunity.id}`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="mt-0.5 p-2 rounded-lg bg-primary/10 shrink-0">
              <SportIcon className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight mb-1" data-testid="text-match">
                {opportunity.match}
              </h3>
              <p className="text-xs text-muted-foreground">{opportunity.sport}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex flex-wrap items-center justify-end gap-1">
              <GameStatusBadge commenceTime={opportunity.commenceTime} />
              {getDataSourceBadge()}
              {opportunity.hold !== undefined && opportunity.hold < 2 && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs font-medium px-2 py-0.5 bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800"
                  data-testid="badge-low-hold"
                >
                  <Shield className="h-3 w-3" />
                  Low Hold
                </Badge>
              )}
              {opportunity.isMiddle && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs font-medium px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800"
                  data-testid="badge-middle"
                >
                  <TrendingUp className="h-3 w-3" />
                  Middle
                </Badge>
              )}
              {opportunity.bookmakers.some(b => (b.ev || 0) > 5) && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                  data-testid="badge-high-ev"
                >
                  <Zap className="h-3 w-3" />
                  High +EV
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span className="tabular-nums" data-testid="text-timestamp">{timeAgo()}</span>
              {opportunity.hold !== undefined && (
                <>
                  <span>•</span>
                  <span className={cn(
                    "font-medium tabular-nums",
                    opportunity.hold < 2 ? "text-cyan-600 dark:text-cyan-400" : ""
                  )} data-testid="text-hold">
                    {opportunity.hold.toFixed(2)}% hold
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profit Section */}
        <div className={cn("flex items-center justify-between p-3 rounded-lg", profitBg)}>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Return</p>
            <p className={cn("text-2xl font-bold tabular-nums", profitColor)} data-testid="text-profit">
              {opportunity.profit.toFixed(2)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Profit</p>
            <p className={cn("text-xl font-bold tabular-nums", profitColor)} data-testid="text-profit-amount">
              ${guaranteedProfit.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Stake</p>
            <p className="text-sm font-semibold tabular-nums text-muted-foreground">
              ${totalStake.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Bookmaker Bets */}
        <div className="space-y-1.5">
          {opportunity.bookmakers.map((bookmaker, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30 hover-elevate"
              data-testid={`bookmaker-bet-${idx}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge variant="outline" className="shrink-0 font-medium text-xs px-2 py-0.5">
                  {bookmaker.name}
                </Badge>
                <span className="font-medium text-xs truncate" data-testid="text-outcome">
                  {bookmaker.outcome}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Odds</p>
                  <p className="text-xs font-semibold tabular-nums" data-testid="text-odds">
                    {bookmaker.odds.toFixed(2)}
                  </p>
                </div>
                
                {bookmaker.ev !== undefined && bookmaker.ev > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">EV</p>
                    <p className={cn(
                      "text-xs font-semibold tabular-nums",
                      bookmaker.ev > 5 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                    )} data-testid="text-ev">
                      +{bookmaker.ev.toFixed(2)}%
                    </p>
                  </div>
                )}
                
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Stake</p>
                  <p className="text-xs font-semibold tabular-nums" data-testid="text-stake">
                    ${bookmaker.stake.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Win Scenarios */}
        {opportunity.isMiddle && opportunity.middleInfo?.winScenarios && (
          <div className="p-2.5 rounded-md bg-purple-50 border border-purple-200 dark:bg-purple-950/30 dark:border-purple-800">
            <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Middle - Win Both Bets!
            </h4>
            <ul className="space-y-0.5">
              {opportunity.middleInfo.winScenarios.map((scenario, idx) => (
                <li key={idx} className="text-xs text-purple-700 dark:text-purple-300 flex items-start gap-1.5">
                  <span className="text-purple-500">•</span>
                  <span>{scenario}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs font-medium flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            data-testid="button-view-details"
          >
            View Details
            <ArrowRight className="h-3 w-3" />
          </Button>
          
          {opportunity.eventId && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-medium flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setLineMovementOpen(true);
              }}
              data-testid="button-view-line-movement"
            >
              <LineChartIcon className="h-3 w-3" />
              Line Movement
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
