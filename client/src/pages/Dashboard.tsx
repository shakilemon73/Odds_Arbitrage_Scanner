import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatsOverview } from "@/components/StatsOverview";
import { OpportunitiesTable } from "@/components/OpportunitiesTable";
import ArbitrageCard, { type ArbitrageOpportunity } from "@/components/ArbitrageCard";
import EmptyState from "@/components/EmptyState";
import SettingsDialog from "@/components/SettingsDialog";
import CacheIndicator from "@/components/CacheIndicator";
import ThemeToggle from "@/components/ThemeToggle";
import StatusIndicator from "@/components/StatusIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, LayoutGrid, TableIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    params.append("sports", selectedSport);
    
    if (minProfit > 0) {
      params.append("minProfit", minProfit.toString());
    }
    
    if (selectedBookmakers.length > 0) {
      params.append("bookmakers", selectedBookmakers.join(","));
    }
    
    const queryString = params.toString();
    return `/api/odds${queryString ? `?${queryString}` : ""}`;
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
      const apiKey = localStorage.getItem("oddsApiKey") || "";
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (apiKey.trim()) {
        headers["x-api-key"] = apiKey;
      }
      
      const response = await fetch(buildQueryUrl(), { headers });
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
    refetchInterval: 30000,
    staleTime: 30000,
  });

  const opportunities = data?.opportunities || [];

  const handleRefresh = () => {
    refetch();
  };

  const getStatus = () => {
    if (isError) return "disconnected";
    if (data?.cachedAt) return "cached";
    return "connected";
  };

  const avgProfit = useMemo(() => {
    if (opportunities.length === 0) return 0;
    const total = opportunities.reduce((sum, opp) => sum + opp.profit, 0);
    return total / opportunities.length;
  }, [opportunities]);

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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
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
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                data-testid="button-refresh"
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                Refresh
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-6 space-y-6">
          <StatsOverview
            totalOpportunities={opportunities.length}
            avgProfit={avgProfit}
            lastUpdated={lastUpdated}
            isLoading={isFetching}
          />

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" data-testid="text-opportunities-title">
              Opportunities ({opportunities.length})
            </h2>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "cards" | "table")}>
              <TabsList data-testid="tabs-view-mode">
                <TabsTrigger value="cards" className="gap-2" data-testid="tab-cards">
                  <LayoutGrid className="h-4 w-4" />
                  Cards
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2" data-testid="tab-table">
                  <TableIcon className="h-4 w-4" />
                  Table
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {opportunities.length > 0 ? (
            <>
              {viewMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-opportunities">
                  {opportunities.map((opp) => (
                    <ArbitrageCard
                      key={opp.id}
                      opportunity={opp}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              ) : (
                <OpportunitiesTable 
                  opportunities={opportunities}
                  onClick={() => {}}
                />
              )}
            </>
          ) : (
            <EmptyState onRefresh={handleRefresh} />
          )}
        </div>
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
