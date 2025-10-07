import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Trophy,
  Clock,
  DollarSign,
  Percent,
  Target,
  ArrowRight,
  Copy,
  CheckCircle2,
  Wifi,
  Database,
  TestTube,
  Calendar,
  Calculator,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import type { ArbitrageOpportunity } from "./ArbitrageCard";

interface OpportunityDetailsDialogProps {
  opportunity: ArbitrageOpportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OpportunityDetailsDialog({
  opportunity,
  open,
  onOpenChange,
}: OpportunityDetailsDialogProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customStake, setCustomStake] = useState<string>("");
  const [useCustomStake, setUseCustomStake] = useState(false);

  useEffect(() => {
    if (open && opportunity) {
      const defaultTotal = opportunity.bookmakers.reduce((sum, b) => sum + b.stake, 0);
      setCustomStake(defaultTotal.toFixed(2));
      setUseCustomStake(false);
    }
  }, [open, opportunity]);

  if (!opportunity) return null;

  const defaultTotalStake = opportunity.bookmakers.reduce((sum, b) => sum + b.stake, 0);
  const activeTotalStake = useCustomStake && customStake ? parseFloat(customStake) : defaultTotalStake;
  const stakeMultiplier = activeTotalStake / defaultTotalStake;

  const calculateStake = (originalStake: number) => {
    return useCustomStake ? originalStake * stakeMultiplier : originalStake;
  };

  const guaranteedProfit = (activeTotalStake * opportunity.profit) / 100;
  const profitLevel = opportunity.profit >= 3 ? "high" : opportunity.profit >= 1 ? "medium" : "low";

  const handleCustomStakeChange = (value: string) => {
    setCustomStake(value);
    setUseCustomStake(value.trim() !== "" && parseFloat(value) > 0);
  };

  const handleResetStake = () => {
    const defaultTotal = opportunity.bookmakers.reduce((sum, b) => sum + b.stake, 0);
    setCustomStake(defaultTotal.toFixed(2));
    setUseCustomStake(false);
  };

  const getDataSourceBadge = () => {
    if (!opportunity.dataSource) return null;

    const sourceConfig = {
      live: {
        label: "Live Data",
        icon: Wifi,
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        description: "Real-time odds from API",
      },
      mock: {
        label: "Mock Data",
        icon: TestTube,
        className: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
        description: "Simulated odds for testing",
      },
      cached: {
        label: "Cached Data",
        icon: Database,
        className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
        description: "Previously fetched real odds",
      },
    };

    const config = sourceConfig[opportunity.dataSource];
    const SourceIcon = config.icon;

    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn("gap-2 border-2", config.className)} data-testid={`badge-source-${opportunity.dataSource}`}>
          <SourceIcon className="h-4 w-4" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-semibold">{config.label}</span>
            <span className="text-[10px] opacity-75">{config.description}</span>
          </div>
        </Badge>
      </div>
    );
  };

  const handleCopyStake = (stake: number, index: number) => {
    navigator.clipboard.writeText(stake.toFixed(2));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatTime = () => {
    const timestamp = new Date(opportunity.timestamp);
    return timestamp.toLocaleString();
  };

  const profitTextClass =
    profitLevel === "high"
      ? "text-emerald-600 dark:text-emerald-400"
      : profitLevel === "medium"
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  const profitBgClass =
    profitLevel === "high"
      ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30"
      : profitLevel === "medium"
        ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30"
        : "bg-muted/40 dark:bg-muted/30 border-border/50";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-opportunity-details">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <Trophy className="h-6 w-6 text-primary" />
                {opportunity.match}
              </DialogTitle>
              <DialogDescription className="text-base">
                {opportunity.sport}
              </DialogDescription>
            </div>
            {getDataSourceBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Investment Calculator */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Investment Calculator</h3>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label htmlFor="custom-stake" className="text-sm mb-2">
                      Your Total Investment
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="custom-stake"
                        type="number"
                        min="0"
                        step="0.01"
                        value={customStake}
                        onChange={(e) => handleCustomStakeChange(e.target.value)}
                        className="pl-9 h-12 text-lg font-semibold"
                        placeholder="Enter amount"
                        data-testid="input-custom-stake"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleResetStake}
                    disabled={!useCustomStake}
                    className="h-12 w-12 shrink-0"
                    data-testid="button-reset-stake"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adjust the total investment to see how stakes and profit change
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profit Summary */}
          <Card className={cn("border-2", profitBgClass)}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Percent className="h-4 w-4" />
                    <span>Profit Margin</span>
                  </div>
                  <p className={cn("text-4xl font-black tabular-nums", profitTextClass)}>
                    {opportunity.profit.toFixed(2)}%
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Guaranteed Profit</span>
                  </div>
                  <p className={cn("text-4xl font-black tabular-nums", profitTextClass)}>
                    ${guaranteedProfit.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>Total Investment</span>
                  </div>
                  <p className="text-4xl font-black tabular-nums" data-testid="text-total-stake">
                    ${activeTotalStake.toFixed(2)}
                  </p>
                  {useCustomStake && (
                    <p className="text-xs text-muted-foreground">
                      (Default: ${defaultTotalStake.toFixed(2)})
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookmaker Stakes */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Betting Strategy
            </h3>
            <div className="grid gap-3">
              {opportunity.bookmakers.map((bookmaker, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-bookmaker-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-semibold">
                            {bookmaker.name}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{bookmaker.outcome}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Odds: <span className="font-semibold text-foreground">{bookmaker.odds.toFixed(2)}</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Stake Required</p>
                          <p className="text-2xl font-bold text-primary" data-testid={`text-stake-${index}`}>
                            ${calculateStake(bookmaker.stake).toFixed(2)}
                          </p>
                          {useCustomStake && (
                            <p className="text-xs text-muted-foreground">
                              (Default: ${bookmaker.stake.toFixed(2)})
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopyStake(calculateStake(bookmaker.stake), index)}
                          data-testid={`button-copy-stake-${index}`}
                          className="shrink-0"
                        >
                          {copiedIndex === index ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Discovered: <span className="font-medium text-foreground">{formatTime()}</span></span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>ID: <span className="font-mono text-xs text-foreground">{opportunity.id}</span></span>
            </div>
          </div>

          {/* How it Works */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-2">
              <h4 className="font-semibold text-sm">How This Works</h4>
              <p className="text-sm text-muted-foreground">
                By placing the stakes shown above on each outcome at their respective bookmakers, you're guaranteed a profit of <span className="font-semibold text-foreground">${guaranteedProfit.toFixed(2)}</span> ({opportunity.profit.toFixed(2)}%) regardless of the match result.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
