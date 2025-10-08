import { useState, useMemo } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/pages/Dashboard";
import BetTracker from "@/pages/BetTracker";
import PromoConverter from "@/pages/PromoConverter";
import NotFound from "@/pages/not-found";
import SettingsDialog from "@/components/SettingsDialog";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Gift, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("all");
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    
    if (selectedTimeFilter !== "all") {
      params.append("timeFilter", selectedTimeFilter);
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
    refetchInterval: (settings?.autoRefreshInterval || 30) * 1000,
    staleTime: (settings?.autoRefreshInterval || 30) * 1000,
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
    setSelectedTimeFilter("all");
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
          selectedTimeFilter={selectedTimeFilter}
          availableBookmakers={availableBookmakers}
          onSportChange={setSelectedSport}
          onBookmakerToggle={handleBookmakerToggle}
          onMinProfitChange={setMinProfit}
          onTimeFilterChange={setSelectedTimeFilter}
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
            selectedTimeFilter={selectedTimeFilter}
            availableBookmakers={availableBookmakers}
            onSportChange={setSelectedSport}
            onBookmakerToggle={handleBookmakerToggle}
            onMinProfitChange={setMinProfit}
            onTimeFilterChange={setSelectedTimeFilter}
            onClearFilters={handleClearFilters}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        </div>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </SidebarProvider>
  );
}

function Router() {
  const [location] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const navItems = [
    { path: "/", label: "Scanner", icon: TrendingUp },
    { path: "/bets", label: "Bet Tracker", icon: Target },
    { path: "/promos", label: "Promos", icon: Gift },
  ];

  return (
    <>
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">DELLTA</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={location === item.path ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("gap-2", location === item.path && "bg-primary/10 text-primary")}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              data-testid="button-settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      <Switch>
        <Route path="/" component={DashboardWrapper} />
        <Route path="/bets" component={BetTracker} />
        <Route path="/promos" component={PromoConverter} />
        <Route component={NotFound} />
      </Switch>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
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
