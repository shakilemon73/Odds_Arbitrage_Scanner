import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import FilterBar, { type BookmakerWithCount } from "@/components/FilterBar";
import ArbitrageCard, { type ArbitrageOpportunity } from "@/components/ArbitrageCard";
import EmptyState from "@/components/EmptyState";
import SettingsDialog from "@/components/SettingsDialog";
import CacheIndicator from "@/components/CacheIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GetOddsResponse {
  opportunities: ArbitrageOpportunity[];
  count: number;
  cachedAt?: string;
  isFromCache?: boolean;
  cacheAge?: number;
}

export default function Dashboard() {
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([]);
  const [minProfit, setMinProfit] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Build query parameters
  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    
    // Always send sports parameter (including "all")
    params.append("sports", selectedSport);
    
    if (minProfit > 0) {
      params.append("minProfit", minProfit.toString());
    }
    
    if (selectedBookmakers.length > 0) {
      params.append("bookmakers", selectedBookmakers.join(","));
    }
    
    const queryString = params.toString();
    // Ensure consistent query string format for cache key stability
    return `/api/odds${queryString ? `?${queryString}` : ""}`;
  };

  // Fetch arbitrage opportunities from API
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
      
      // Always send API key if available - let backend decide whether to use it
      if (apiKey.trim()) {
        headers["x-api-key"] = apiKey;
      }
      
      const response = await fetch(buildQueryUrl(), { headers });
      if (!response.ok) {
        // Try to parse error response body for detailed error message
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 30000, // Consider data stale after 30 seconds (matches refetch interval)
  });

  const opportunities = data?.opportunities || [];

  // Extract and count bookmakers from opportunities data
  const availableBookmakers = useMemo<BookmakerWithCount[]>(() => {
    if (!data?.opportunities || data.opportunities.length === 0) {
      return [];
    }

    // Count how many times each bookmaker appears
    const bookmakerCounts = new Map<string, number>();
    
    data.opportunities.forEach(opp => {
      opp.bookmakers.forEach(b => {
        bookmakerCounts.set(b.name, (bookmakerCounts.get(b.name) || 0) + 1);
      });
    });

    // Convert to array with counts
    const bookmakersWithCounts: BookmakerWithCount[] = Array.from(bookmakerCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending (most popular first)

    // Limit to top 15 bookmakers
    return bookmakersWithCounts.slice(0, 15);
  }, [data?.opportunities]);

  const handleRefresh = () => {
    refetch();
  };

  const handleBookmakerToggle = (bookmaker: string) => {
    setSelectedBookmakers((prev) =>
      prev.includes(bookmaker)
        ? prev.filter((b) => b !== bookmaker)
        : [...prev, bookmaker]
    );
  };

  const handleClearFilters = () => {
    setSelectedSport("all");
    setSelectedBookmakers([]);
    setMinProfit(0);
  };

  // Determine status indicator
  const getStatus = () => {
    if (isError) return "disconnected";
    if (data?.cachedAt) return "cached";
    return "connected";
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5 pointer-events-none" aria-hidden="true" />
        <div className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        
        <div className="relative">
          <DashboardHeader
            status="connected"
            onRefresh={handleRefresh}
            onSettingsClick={() => setSettingsOpen(true)}
            isRefreshing={true}
          />

          <FilterBar
            selectedSport={selectedSport}
            selectedBookmakers={selectedBookmakers}
            minProfit={minProfit}
            availableBookmakers={availableBookmakers}
            onSportChange={setSelectedSport}
            onBookmakerToggle={handleBookmakerToggle}
            onMinProfitChange={setMinProfit}
            onClearFilters={handleClearFilters}
          />

          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 w-full rounded-xl" data-testid={`skeleton-${i}`} />
              ))}
            </div>
          </main>

          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5 pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" aria-hidden="true" />
      <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" aria-hidden="true" />
      
      <div className="relative">
        <DashboardHeader
          status={getStatus()}
          onRefresh={handleRefresh}
          onSettingsClick={() => setSettingsOpen(true)}
          isRefreshing={isFetching}
        />

        <FilterBar
          selectedSport={selectedSport}
          selectedBookmakers={selectedBookmakers}
          minProfit={minProfit}
          availableBookmakers={availableBookmakers}
          onSportChange={setSelectedSport}
          onBookmakerToggle={handleBookmakerToggle}
          onMinProfitChange={setMinProfit}
          onClearFilters={handleClearFilters}
        />

        {data?.isFromCache && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
            <CacheIndicator isFromCache={data.isFromCache} cacheAge={data.cacheAge} />
          </div>
        )}

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
          {isError ? (
            <div className="text-center py-16" role="alert">
              <div className={cn(
                "rounded-2xl p-8 mb-6 inline-block",
                "bg-destructive/10 dark:bg-destructive/15 backdrop-blur-sm",
                "border border-destructive/20"
              )}>
                <svg className="h-16 w-16 text-destructive mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3">Connection Error</h2>
              <p className="text-muted-foreground text-base mb-8 max-w-md mx-auto" data-testid="text-error">
                Unable to load arbitrage opportunities. Please check your connection and try again.
              </p>
              <Button
                onClick={handleRefresh}
                variant="default"
                size="lg"
                data-testid="button-retry"
                className="gap-2 font-bold shadow-lg shadow-primary/20"
              >
                Try Again
              </Button>
            </div>
          ) : opportunities.length > 0 ? (
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              role="feed"
              aria-label="Arbitrage opportunities"
              aria-busy={isFetching}
            >
              {opportunities.map((opp) => (
                <ArbitrageCard
                  key={opp.id}
                  opportunity={opp}
                  onClick={() => {}}
                />
              ))}
            </div>
          ) : (
            <EmptyState onRefresh={handleRefresh} />
          )}
        </main>

        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </div>
  );
}
