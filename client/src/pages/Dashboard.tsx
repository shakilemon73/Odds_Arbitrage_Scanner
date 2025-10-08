import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatsOverview } from "@/components/StatsOverview";
import { OpportunitiesTable } from "@/components/OpportunitiesTable";
import ArbitrageCard, { type ArbitrageOpportunity } from "@/components/ArbitrageCard";
import EmptyState from "@/components/EmptyState";
import SettingsDialog from "@/components/SettingsDialog";
import OpportunityDetailsDialog from "@/components/OpportunityDetailsDialog";
import CacheIndicator from "@/components/CacheIndicator";
import ThemeToggle from "@/components/ThemeToggle";
import StatusIndicator from "@/components/StatusIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, LayoutGrid, TableIcon, TrendingUp, Percent, Trophy, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { BookmakerWithCount } from "@/components/FilterBar";

interface GetOddsResponse {
  opportunities: ArbitrageOpportunity[];
  count: number;
  cachedAt?: string;
  isFromCache?: boolean;
  cacheAge?: number;
}

interface DashboardProps {
  selectedSport: string;
  selectedBookmakers: string[];
  minProfit: number;
  availableBookmakers: BookmakerWithCount[];
  onSportChange: (sport: string) => void;
  onBookmakerToggle: (bookmaker: string) => void;
  onMinProfitChange: (profit: number) => void;
  onClearFilters: () => void;
  onSettingsClick: () => void;
}

export default function Dashboard({
  selectedSport,
  selectedBookmakers,
  minProfit,
  availableBookmakers,
  onSportChange,
  onBookmakerToggle,
  onMinProfitChange,
  onClearFilters,
  onSettingsClick,
}: DashboardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [opportunityType, setOpportunityType] = useState<"all" | "middles" | "positive-ev" | "props">("all");
  const [showLowHoldOnly, setShowLowHoldOnly] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const previousOpportunitiesRef = useRef<ArbitrageOpportunity[]>([]);
  const { toast } = useToast();

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
    },
    staleTime: 60000,
  });

  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    params.append("sports", selectedSport);
    
    if (minProfit > 0) {
      params.append("minProfit", minProfit.toString());
    }
    
    if (selectedBookmakers.length > 0) {
      params.append("bookmakers", selectedBookmakers.join(","));
    }

    if (opportunityType === "positive-ev") {
      params.append("minEV", settings?.minEVPercentage?.toString() || "2");
    }
    
    const queryString = params.toString();
    
    // Different endpoints based on opportunity type
    const baseUrl = opportunityType === "middles" 
      ? "/api/middles" 
      : opportunityType === "positive-ev"
      ? "/api/positive-ev"
      : "/api/odds";
    
    return `${baseUrl}${queryString ? `?${queryString}` : ""}`;
  };

  const { 
    data, 
    isLoading, 
    isError, 
    refetch,
    isFetching 
  } = useQuery<GetOddsResponse>({
    queryKey: [buildQueryUrl()],
    queryFn: async () => {
      const response = await fetch(buildQueryUrl());
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      return response.json();
    },
    refetchInterval: (settings?.autoRefreshInterval || 30) * 1000,
    staleTime: (settings?.autoRefreshInterval || 30) * 1000,
  });

  const opportunities = data?.opportunities || [];

  // Task 6: Calculate hold % for each opportunity
  const opportunitiesWithHold = useMemo(() => {
    return opportunities.map(opp => {
      // Calculate market hold as sum of implied probabilities - 100
      const impliedProbs = opp.bookmakers.map(b => (1 / b.odds) * 100);
      const totalImplied = impliedProbs.reduce((sum, p) => sum + p, 0);
      const hold = totalImplied - 100;
      return { ...opp, hold: Math.round(hold * 100) / 100 };
    });
  }, [opportunities]);

  // Task 6: Filter for low hold opportunities
  const filteredOpportunities = useMemo(() => {
    if (!showLowHoldOnly) return opportunitiesWithHold;
    return opportunitiesWithHold.filter(opp => (opp.hold || 0) < 2);
  }, [opportunitiesWithHold, showLowHoldOnly]);

  // Task 11: Check for new opportunities and trigger notifications
  useEffect(() => {
    if (!settings?.notificationsEnabled || !data?.opportunities) return;

    const currentOpps = data.opportunities;
    const previousOpps = previousOpportunitiesRef.current;
    
    // Find new opportunities
    const newOpps = currentOpps.filter(
      curr => !previousOpps.some(prev => prev.id === curr.id)
    );

    // Filter by minimum profit threshold
    const minProfitThreshold = settings.notificationProfitThreshold || 2;
    const notifiableOpps = newOpps.filter(opp => opp.profit >= minProfitThreshold);

    if (notifiableOpps.length > 0) {
      setNotificationCount(prev => prev + notifiableOpps.length);

      // Show browser notification
      if (Notification.permission === "granted") {
        new Notification("New Arbitrage Opportunities!", {
          body: `${notifiableOpps.length} new opportunities with ${notifiableOpps[0].profit.toFixed(2)}% profit`,
          icon: "/favicon.ico",
        });
      }

      // Play notification sound if enabled
      if (settings.notificationSoundEnabled) {
        const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWm98OScTgwOUKzn77RgGwU7k9n0ynosBSF0yPLaizsKEmS76+yjUhQJOpnd9MR0KwUuhM/z2Ik3CBhqvvLlm04LDU6r5O+yYBoEOpXa9Ml6LgUefMny3Io3CBZpu/Domk8NDUyo4u6wXxsEOpXb9cp6LgUffcv03Is4CBZpuvDnmk4MDEyn4u6vXhoEOpXb9cp6LgUefcv03Is4CBZpuvDnmk4MDEyn4u6vXhoEOpXb9cp6LgUefcv03Is4CBZpuvDnmk4MDEyn4u6vXhoEOpXb9cp6LgUefcv03Is4CBZpuvDnmk4MDEyn4u6vXhoEOpXb9cp6LgUefcv03Is4CBZpuvDnmk4MDEyn4u6vXhoEOpXb9cp6LgUefcv03Is4CBZpuvDnmk4MDEyn4u6vXhoEOpXb9cp6LgUefcv03Is4CBZpuvDnmk4MDEyn4u6vXhoEOpXb9cp6LgUefcv03Is4CBZpuvDnmk4MDEyn4u6vXhoEOpXb9cp6LgUefcv03Is4CBZpuvDnmk4MDEyn4u6vXhoEOpXb9cp6LgUefcv03Is4CBZpuvDnmk4MDEyn4u6vXhoEOpXb9cp6LgUefcv03Is4CBZpuvDnmk4MDEyn4u6vXhoEOpXb9cp6LgUefcv03Is4CBZpuvDnmk4MDEyn4u6vXhoEOpXb9cp6LgUefcv03Is4CBZpuvDnmk4MDEyn4u6vXhoE");
      }

      // Show toast notification
      toast({
        title: "New Opportunities!",
        description: `${notifiableOpps.length} new arbitrage opportunities found`,
      });
    }

    previousOpportunitiesRef.current = currentOpps;
  }, [data?.opportunities, settings, toast]);

  const handleRefresh = () => {
    refetch();
  };

  const handleCardClick = (opportunity: ArbitrageOpportunity) => {
    setSelectedOpportunity(opportunity);
    setDetailsOpen(true);
  };

  const getStatus = () => {
    if (isError) return "disconnected";
    if (data?.cachedAt) return "cached";
    return "connected";
  };

  const avgProfit = useMemo(() => {
    if (filteredOpportunities.length === 0) return 0;
    const total = filteredOpportunities.reduce((sum, opp) => sum + opp.profit, 0);
    return total / filteredOpportunities.length;
  }, [filteredOpportunities]);

  const lastUpdated = useMemo(() => {
    if (!data?.cachedAt) return "Live";
    const date = new Date(data.cachedAt);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return date.toLocaleTimeString();
  }, [data?.cachedAt]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
                Dashboard
              </h1>
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" data-testid={`skeleton-stat-${i}`} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 w-full" data-testid={`skeleton-${i}`} />
              ))}
            </div>
          </div>
        </main>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-dashboard-title">
                Dashboard
              </h1>
              <StatusIndicator status={getStatus()} data-testid="status-indicator" />
              {data?.isFromCache && (
                <CacheIndicator 
                  isFromCache={data.isFromCache} 
                  cacheAge={data.cacheAge}
                />
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {notificationCount > 0 && (
                <div className="relative" data-testid="notification-badge">
                  <Bell className="h-5 w-5 text-primary" />
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {notificationCount}
                  </Badge>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                data-testid="button-refresh"
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isFetching && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          <StatsOverview
            totalOpportunities={filteredOpportunities.length}
            avgProfit={avgProfit}
            lastUpdated={lastUpdated}
            isLoading={isFetching}
          />

          {/* Main Tabs for Opportunity Types */}
          <Tabs value={opportunityType} onValueChange={(v) => setOpportunityType(v as any)} data-testid="tabs-opportunity-type">
            <TabsList className="w-full grid grid-cols-4 mb-4" data-testid="tabs-list-opportunity-type">
              <TabsTrigger value="all" className="gap-1.5" data-testid="tab-all">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">All</span>
              </TabsTrigger>
              <TabsTrigger value="middles" className="gap-1.5" data-testid="tab-middles">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Middles</span>
              </TabsTrigger>
              <TabsTrigger value="positive-ev" className="gap-1.5" data-testid="tab-positive-ev">
                <Percent className="h-4 w-4" />
                <span className="hidden sm:inline">+EV</span>
              </TabsTrigger>
              <TabsTrigger value="props" className="gap-1.5" data-testid="tab-props">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Props</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-base sm:text-lg font-semibold" data-testid="text-opportunities-title">
                    Opportunities ({filteredOpportunities.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="low-hold-filter"
                      checked={showLowHoldOnly}
                      onCheckedChange={setShowLowHoldOnly}
                      data-testid="switch-low-hold"
                    />
                    <Label htmlFor="low-hold-filter" className="text-xs sm:text-sm cursor-pointer">
                      Low Hold (&lt;2%)
                    </Label>
                  </div>
                </div>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "cards" | "table")}>
                  <TabsList data-testid="tabs-view-mode" className="w-full sm:w-auto">
                    <TabsTrigger value="cards" className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm" data-testid="tab-cards">
                      <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Cards
                    </TabsTrigger>
                    <TabsTrigger value="table" className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm" data-testid="tab-table">
                      <TableIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Table
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {filteredOpportunities.length > 0 ? (
                <>
                  {viewMode === "cards" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6" data-testid="grid-opportunities">
                      {filteredOpportunities.map((opp) => (
                        <ArbitrageCard
                          key={opp.id}
                          opportunity={opp}
                          onClick={() => handleCardClick(opp)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                      <OpportunitiesTable 
                        opportunities={filteredOpportunities}
                        onClick={handleCardClick}
                      />
                    </div>
                  )}
                </>
              ) : (
                <EmptyState onRefresh={handleRefresh} />
              )}
            </TabsContent>

            <TabsContent value="middles" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-base sm:text-lg font-semibold" data-testid="text-middles-title">
                  Middle Opportunities ({filteredOpportunities.length})
                </h2>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "cards" | "table")}>
                  <TabsList data-testid="tabs-view-mode-middles">
                    <TabsTrigger value="cards" className="gap-1.5" data-testid="tab-cards-middles">
                      <LayoutGrid className="h-4 w-4" />
                      Cards
                    </TabsTrigger>
                    <TabsTrigger value="table" className="gap-1.5" data-testid="tab-table-middles">
                      <TableIcon className="h-4 w-4" />
                      Table
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {filteredOpportunities.length > 0 ? (
                viewMode === "cards" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
                    {filteredOpportunities.map((opp) => (
                      <ArbitrageCard
                        key={opp.id}
                        opportunity={opp}
                        onClick={() => handleCardClick(opp)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <OpportunitiesTable 
                      opportunities={filteredOpportunities}
                      onClick={handleCardClick}
                    />
                  </div>
                )
              ) : (
                <EmptyState onRefresh={handleRefresh} message="No middle opportunities found" />
              )}
            </TabsContent>

            <TabsContent value="positive-ev" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-base sm:text-lg font-semibold" data-testid="text-positive-ev-title">
                  +EV Opportunities ({filteredOpportunities.length})
                </h2>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "cards" | "table")}>
                  <TabsList data-testid="tabs-view-mode-ev">
                    <TabsTrigger value="cards" className="gap-1.5" data-testid="tab-cards-ev">
                      <LayoutGrid className="h-4 w-4" />
                      Cards
                    </TabsTrigger>
                    <TabsTrigger value="table" className="gap-1.5" data-testid="tab-table-ev">
                      <TableIcon className="h-4 w-4" />
                      Table
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {filteredOpportunities.length > 0 ? (
                viewMode === "cards" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
                    {filteredOpportunities.map((opp) => (
                      <ArbitrageCard
                        key={opp.id}
                        opportunity={opp}
                        onClick={() => handleCardClick(opp)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <OpportunitiesTable 
                      opportunities={filteredOpportunities}
                      onClick={handleCardClick}
                    />
                  </div>
                )
              ) : (
                <EmptyState onRefresh={handleRefresh} message="No +EV opportunities found" />
              )}
            </TabsContent>

            <TabsContent value="props" className="space-y-4">
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center space-y-4 max-w-md">
                  <Trophy className="h-16 w-16 mx-auto text-muted-foreground" />
                  <h2 className="text-2xl font-bold" data-testid="text-props-title">
                    Props & Picks Coming Soon
                  </h2>
                  <p className="text-muted-foreground">
                    PrizePicks and player props arbitrage opportunities will be available in the next update.
                    For now, you can manually track prop bets using the Bet Tracker.
                  </p>
                  <div className="p-4 bg-muted rounded-lg text-sm text-left space-y-2">
                    <p className="font-semibold">What's coming:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>PrizePicks entry analysis</li>
                      <li>Player prop comparisons across books</li>
                      <li>Same game parlay opportunities</li>
                      <li>Props arbitrage scanner</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <OpportunityDetailsDialog
        opportunity={selectedOpportunity}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
