import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import FilterBar from "@/components/FilterBar";
import ArbitrageCard, { type ArbitrageOpportunity } from "@/components/ArbitrageCard";
import EmptyState from "@/components/EmptyState";
import SettingsDialog from "@/components/SettingsDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface GetOddsResponse {
  opportunities: ArbitrageOpportunity[];
  count: number;
  cachedAt?: string;
}

export default function Dashboard() {
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([]);
  const [minProfit, setMinProfit] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Build query parameters
  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    
    if (selectedSport !== "all") {
      params.append("sports", selectedSport);
    }
    
    if (minProfit > 0) {
      params.append("minProfit", minProfit.toString());
    }
    
    if (selectedBookmakers.length > 0) {
      params.append("bookmakers", selectedBookmakers.join(","));
    }
    
    const queryString = params.toString();
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
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });

  const opportunities = data?.opportunities || [];

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
      <div className="min-h-screen bg-background">
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
          onSportChange={setSelectedSport}
          onBookmakerToggle={handleBookmakerToggle}
          onMinProfitChange={setMinProfit}
          onClearFilters={handleClearFilters}
        />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full" data-testid={`skeleton-${i}`} />
            ))}
          </div>
        </main>

        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
        onSportChange={setSelectedSport}
        onBookmakerToggle={handleBookmakerToggle}
        onMinProfitChange={setMinProfit}
        onClearFilters={handleClearFilters}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isError ? (
          <div className="text-center py-12">
            <p className="text-destructive text-lg mb-4" data-testid="text-error">
              Failed to load arbitrage opportunities
            </p>
            <button
              onClick={handleRefresh}
              className="text-primary hover:underline"
              data-testid="button-retry"
            >
              Try again
            </button>
          </div>
        ) : opportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <ArbitrageCard
                key={opp.id}
                opportunity={opp}
                onClick={() => console.log("Viewing opportunity:", opp.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState onRefresh={handleRefresh} />
        )}
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
