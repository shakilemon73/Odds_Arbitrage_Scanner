import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, TrendingUp, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArbitrageOpportunity } from "@/components/ArbitrageCard";

interface OpportunitiesTableProps {
  opportunities: ArbitrageOpportunity[];
  onClick?: (opportunity: ArbitrageOpportunity) => void;
}

export function OpportunitiesTable({ opportunities, onClick }: OpportunitiesTableProps) {
  const getProfitLevel = (profit: number) => {
    if (profit >= 3) return "high";
    if (profit >= 1) return "medium";
    return "low";
  };

  const getProfitColor = (profit: number) => {
    const level = getProfitLevel(profit);
    if (level === "high") return "text-emerald-600 dark:text-emerald-400";
    if (level === "medium") return "text-amber-600 dark:text-amber-400";
    return "text-muted-foreground";
  };

  const getProfitBgColor = (profit: number) => {
    const level = getProfitLevel(profit);
    if (level === "high") return "bg-emerald-500/10";
    if (level === "medium") return "bg-amber-500/10";
    return "bg-muted/50";
  };

  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return then.toLocaleTimeString();
  };

  return (
    <div className="rounded-lg sm:rounded-xl border-2 border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 border-b-2">
            <TableHead className="font-bold text-[10px] sm:text-xs uppercase tracking-wider h-10 sm:h-12 whitespace-nowrap">
              <div className="flex items-center gap-1 sm:gap-2">
                <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Match</span>
              </div>
            </TableHead>
            <TableHead className="font-bold text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">Sport</TableHead>
            <TableHead className="font-bold text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">Bookmakers</TableHead>
            <TableHead className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Profit
              </div>
            </TableHead>
            <TableHead className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Stake
              </div>
            </TableHead>
            <TableHead className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-right whitespace-nowrap">Returns</TableHead>
            <TableHead className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-right whitespace-nowrap hidden sm:table-cell">
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Time
              </div>
            </TableHead>
            <TableHead className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-right whitespace-nowrap">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opp) => {
            const totalStake = opp.bookmakers.reduce((sum, b) => sum + b.stake, 0);
            const guaranteedProfit = (totalStake * opp.profit) / 100;
            
            return (
              <TableRow 
                key={opp.id} 
                className="hover-elevate cursor-pointer transition-all h-14 sm:h-16 border-b"
                onClick={() => onClick?.(opp)}
                data-testid={`row-opportunity-${opp.id}`}
              >
                <TableCell className="font-bold text-xs sm:text-sm max-w-[120px] sm:max-w-none" data-testid="cell-match">
                  <div className="truncate">{opp.match}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-semibold text-[10px] sm:text-xs whitespace-nowrap">
                    {opp.sport}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {opp.bookmakers.map((bm, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="text-[10px] sm:text-xs font-medium whitespace-nowrap"
                      >
                        {bm.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold tabular-nums text-sm sm:text-base whitespace-nowrap",
                    getProfitBgColor(opp.profit),
                    getProfitColor(opp.profit)
                  )} data-testid="cell-profit">
                    {opp.profit.toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-bold tabular-nums text-xs sm:text-sm whitespace-nowrap" data-testid="cell-stake">
                    ${totalStake.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    "font-bold tabular-nums text-xs sm:text-sm whitespace-nowrap",
                    getProfitColor(opp.profit)
                  )} data-testid="cell-returns">
                    ${guaranteedProfit.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  <span className="text-xs text-muted-foreground font-medium tabular-nums whitespace-nowrap" data-testid="cell-time">
                    {timeAgo(opp.timestamp)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick?.(opp);
                    }}
                    className="gap-1 sm:gap-1.5 font-semibold text-xs sm:text-sm"
                    data-testid="button-view-details"
                  >
                    <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
