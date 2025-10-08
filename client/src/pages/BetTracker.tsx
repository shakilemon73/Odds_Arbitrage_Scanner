import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, DollarSign, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Bet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function BetTracker() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: bets, isLoading } = useQuery<Bet[]>({
    queryKey: ["/api/bets"],
  });

  const updateBetMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Bet> }) => {
      return await apiRequest(`/api/bets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      toast({
        title: "Bet updated",
        description: "Bet status has been updated successfully",
      });
    },
  });

  const deleteBetMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/bets/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      toast({
        title: "Bet deleted",
        description: "Bet has been removed successfully",
      });
    },
  });

  const filteredBets = bets?.filter(bet => 
    statusFilter === "all" || bet.status === statusFilter
  ) || [];

  const stats = {
    total: filteredBets.length,
    pending: filteredBets.filter(b => b.status === "pending").length,
    won: filteredBets.filter(b => b.status === "won").length,
    lost: filteredBets.filter(b => b.status === "lost").length,
    totalProfit: filteredBets.reduce((sum, b) => sum + (b.status === "won" ? b.profit : b.status === "lost" ? -b.profit : 0), 0),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won": return <CheckCircle2 className="h-4 w-4" />;
      case "lost": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won": return "bg-success/10 text-success border-success/20";
      case "lost": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-warning/10 text-warning border-warning/20";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="heading-bet-tracker">
          Bet Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Track your arbitrage bets and monitor performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardDescription className="text-xs uppercase">Total Bets</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-success/30">
          <CardHeader className="p-4 sm:p-6">
            <CardDescription className="text-xs uppercase">Won</CardDescription>
            <CardTitle className="text-2xl text-success">{stats.won}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-destructive/30">
          <CardHeader className="p-4 sm:p-6">
            <CardDescription className="text-xs uppercase">Lost</CardDescription>
            <CardTitle className="text-2xl text-destructive">{stats.lost}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn("border-2", stats.totalProfit >= 0 ? "border-success/30" : "border-destructive/30")}>
          <CardHeader className="p-4 sm:p-6">
            <CardDescription className="text-xs uppercase flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Total P/L
            </CardDescription>
            <CardTitle className={cn("text-2xl flex items-center gap-2", stats.totalProfit >= 0 ? "text-success" : "text-destructive")}>
              {stats.totalProfit >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              ${Math.abs(stats.totalProfit).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bets</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredBets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No bets tracked yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Track bets from the dashboard to monitor your performance
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBets.map((bet) => (
            <Card key={bet.id} className="hover-elevate" data-testid={`card-bet-${bet.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      {bet.match}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs sm:text-sm">
                      {bet.sport} • {new Date(bet.timestamp).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={cn("gap-1.5", getStatusColor(bet.status))} data-testid={`badge-status-${bet.id}`}>
                    {getStatusIcon(bet.status)}
                    {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bet.bookmakers.map((bm, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50">
                      <div className="font-medium text-sm">{bm.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{bm.outcome}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs">Odds: {bm.odds}</span>
                        <span className="font-mono text-sm font-medium">${bm.stake}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {bet.clv !== undefined && (
                  <div className={cn("p-2 rounded-md text-sm font-medium", bet.clv >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    CLV: {bet.clv >= 0 ? "+" : ""}{bet.clv.toFixed(2)}%
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Profit: </span>
                    <span className={cn("font-medium", bet.status === "won" ? "text-success" : bet.status === "lost" ? "text-destructive" : "")}>
                      ${bet.profit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {bet.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBetMutation.mutate({ id: bet.id, updates: { status: "won" } })}
                          data-testid={`button-mark-won-${bet.id}`}
                        >
                          Mark Won
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBetMutation.mutate({ id: bet.id, updates: { status: "lost" } })}
                          data-testid={`button-mark-lost-${bet.id}`}
                        >
                          Mark Lost
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteBetMutation.mutate(bet.id)}
                      data-testid={`button-delete-${bet.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
