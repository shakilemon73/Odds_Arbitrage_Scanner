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
import { ArrowRight } from "lucide-react";
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

  const getProfitBg = (profit: number) => {
    const level = getProfitLevel(profit);
    if (level === "high") return "bg-emerald-50 dark:bg-emerald-950/30";
    if (level === "medium") return "bg-amber-50 dark:bg-amber-950/30";
    return "bg-muted/30";
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
    <div className="rounded-lg border-0 shadow-sm bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
              <TableHead className="font-semibold text-xs h-10 whitespace-nowrap">
                Match
              </TableHead>
              <TableHead className="font-semibold text-xs whitespace-nowrap">Sport</TableHead>
              <TableHead className="font-semibold text-xs whitespace-nowrap">Bookmakers</TableHead>
              <TableHead className="font-semibold text-xs text-right whitespace-nowrap">
                Profit
              </TableHead>
              <TableHead className="font-semibold text-xs text-right whitespace-nowrap">
                Stake
              </TableHead>
              <TableHead className="font-semibold text-xs text-right whitespace-nowrap">Returns</TableHead>
              <TableHead className="font-semibold text-xs text-right whitespace-nowrap hidden sm:table-cell">
                Time
              </TableHead>
              <TableHead className="font-semibold text-xs text-right whitespace-nowrap w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp, index) => {
              const totalStake = opp.bookmakers.reduce((sum, b) => sum + b.stake, 0);
              const guaranteedProfit = (totalStake * opp.profit) / 100;
              
              return (
                <TableRow 
                  key={opp.id} 
                  className={cn(
                    "cursor-pointer transition-colors h-12 border-b",
                    "hover:bg-muted/50",
                    index % 2 === 0 ? "bg-background" : "bg-muted/20"
                  )}
                  onClick={() => onClick?.(opp)}
                  data-testid={`row-opportunity-${opp.id}`}
                >
                  <TableCell className="font-medium text-sm" data-testid="cell-match">
                    <div className="max-w-[200px] truncate">{opp.match}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium text-xs">
                      {opp.sport}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {opp.bookmakers.map((bm, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-xs font-medium"
                        >
                          {bm.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-md font-semibold tabular-nums text-sm",
                      getProfitBg(opp.profit),
                      getProfitColor(opp.profit)
                    )} data-testid="cell-profit">
                      {opp.profit.toFixed(2)}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium tabular-nums text-sm" data-testid="cell-stake">
                      ${totalStake.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-semibold tabular-nums text-sm",
                      getProfitColor(opp.profit)
                    )} data-testid="cell-returns">
                      ${guaranteedProfit.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    <span className="text-xs text-muted-foreground font-medium tabular-nums" data-testid="cell-time">
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
                      className="gap-1 font-medium text-xs h-7 px-2"
                      data-testid="button-view-details"
                    >
                      View
                      <ArrowRight className="h-3 w-3" />
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
