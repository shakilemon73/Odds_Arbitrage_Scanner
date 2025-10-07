import { useState, useMemo } from "react";
import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import type { BookmakerWithCount } from "@/components/FilterBar";
import type { ArbitrageOpportunity } from "@/components/ArbitrageCard";

interface GetOddsResponse {
  opportunities: ArbitrageOpportunity[];
  count: number;
  cachedAt?: string;
  isFromCache?: boolean;
  cacheAge?: number;
}

function DashboardWrapper() {
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([]);
  const [minProfit, setMinProfit] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const { data } = useQuery<GetOddsResponse>({
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

  const availableBookmakers = useMemo<BookmakerWithCount[]>(() => {
    if (!data?.opportunities || data.opportunities.length === 0) {
      return [];
    }

    const bookmakerCounts = new Map<string, number>();
    
    data.opportunities.forEach(opp => {
      opp.bookmakers.forEach(b => {
        bookmakerCounts.set(b.name, (bookmakerCounts.get(b.name) || 0) + 1);
      });
    });

    const bookmakersWithCounts: BookmakerWithCount[] = Array.from(bookmakerCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return bookmakersWithCounts.slice(0, 15);
  }, [data?.opportunities]);

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

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          selectedSport={selectedSport}
          selectedBookmakers={selectedBookmakers}
          minProfit={minProfit}
          availableBookmakers={availableBookmakers}
          onSportChange={setSelectedSport}
          onBookmakerToggle={handleBookmakerToggle}
          onMinProfitChange={setMinProfit}
          onClearFilters={handleClearFilters}
          onSettingsClick={() => setSettingsOpen(true)}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur px-4 py-2">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </div>
          <Dashboard
            selectedSport={selectedSport}
            selectedBookmakers={selectedBookmakers}
            minProfit={minProfit}
            availableBookmakers={availableBookmakers}
            onSportChange={setSelectedSport}
            onBookmakerToggle={handleBookmakerToggle}
            onMinProfitChange={setMinProfit}
            onClearFilters={handleClearFilters}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardWrapper} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
