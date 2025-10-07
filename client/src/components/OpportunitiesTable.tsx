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
import { ArrowRight, DollarSign } from "lucide-react";
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
    if (level === "high") return "text-success";
    if (level === "medium") return "text-warning";
    return "text-muted-foreground";
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
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-semibold">Match</TableHead>
            <TableHead className="font-semibold">Sport</TableHead>
            <TableHead className="font-semibold">Bookmakers</TableHead>
            <TableHead className="font-semibold text-right">Profit</TableHead>
            <TableHead className="font-semibold text-right">Stake</TableHead>
            <TableHead className="font-semibold text-right">Returns</TableHead>
            <TableHead className="font-semibold text-right">Time</TableHead>
            <TableHead className="font-semibold text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opp) => {
            const totalStake = opp.bookmakers.reduce((sum, b) => sum + b.stake, 0);
            const guaranteedProfit = (totalStake * opp.profit) / 100;
            
            return (
              <TableRow 
                key={opp.id} 
                className="hover-elevate cursor-pointer"
                onClick={() => onClick?.(opp)}
                data-testid={`row-opportunity-${opp.id}`}
              >
                <TableCell className="font-medium max-w-[200px]">
                  <div className="truncate" title={opp.match}>{opp.match}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {opp.sport}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {opp.bookmakers.map((bm, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {bm.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn("font-bold", getProfitColor(opp.profit))}>
                    {opp.profit.toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-muted-foreground">
                    ${totalStake.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-success">
                    +${guaranteedProfit.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {timeAgo(opp.timestamp)}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick?.(opp);
                    }}
                    data-testid={`button-view-${opp.id}`}
                  >
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
