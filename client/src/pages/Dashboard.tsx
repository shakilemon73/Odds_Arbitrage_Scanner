import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import FilterBar from "@/components/FilterBar";
import ArbitrageCard, { type ArbitrageOpportunity } from "@/components/ArbitrageCard";
import EmptyState from "@/components/EmptyState";
import SettingsDialog from "@/components/SettingsDialog";

// TODO: remove mock functionality
const MOCK_OPPORTUNITIES: ArbitrageOpportunity[] = [
  {
    id: "1",
    sport: "Soccer",
    match: "Man City vs Arsenal",
    bookmakers: [
      { name: "Bet365", outcome: "Home", odds: 2.10, stake: 476 },
      { name: "DraftKings", outcome: "Away", odds: 3.50, stake: 286 },
      { name: "FanDuel", outcome: "Draw", odds: 3.80, stake: 263 },
    ],
    profit: 3.2,
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    sport: "Basketball",
    match: "Lakers vs Warriors",
    bookmakers: [
      { name: "BetMGM", outcome: "Home", odds: 1.95, stake: 513 },
      { name: "Caesars", outcome: "Away", odds: 2.05, stake: 488 },
    ],
    profit: 2.1,
    timestamp: new Date().toISOString(),
  },
  {
    id: "3",
    sport: "Tennis",
    match: "Djokovic vs Alcaraz",
    bookmakers: [
      { name: "PointsBet", outcome: "Player 1", odds: 2.25, stake: 444 },
      { name: "FanDuel", outcome: "Player 2", odds: 1.85, stake: 541 },
    ],
    profit: 1.8,
    timestamp: new Date().toISOString(),
  },
  {
    id: "4",
    sport: "Soccer",
    match: "Real Madrid vs Barcelona",
    bookmakers: [
      { name: "DraftKings", outcome: "Home", odds: 2.40, stake: 417 },
      { name: "Bet365", outcome: "Away", odds: 3.00, stake: 333 },
      { name: "BetMGM", outcome: "Draw", odds: 3.60, stake: 278 },
    ],
    profit: 4.5,
    timestamp: new Date().toISOString(),
  },
  {
    id: "5",
    sport: "Basketball",
    match: "Celtics vs Heat",
    bookmakers: [
      { name: "FanDuel", outcome: "Home", odds: 1.90, stake: 526 },
      { name: "Caesars", outcome: "Away", odds: 2.15, stake: 465 },
    ],
    profit: 1.2,
    timestamp: new Date().toISOString(),
  },
];

export default function Dashboard() {
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([]);
  const [minProfit, setMinProfit] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [opportunities] = useState<ArbitrageOpportunity[]>(MOCK_OPPORTUNITIES); // TODO: remove mock functionality

  const handleRefresh = () => {
    setIsRefreshing(true);
    console.log("Refreshing data...");
    setTimeout(() => {
      setIsRefreshing(false);
      console.log("Data refreshed");
    }, 1000);
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

  // Filter opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    if (selectedSport !== "all" && opp.sport.toLowerCase() !== selectedSport) {
      return false;
    }
    if (selectedBookmakers.length > 0) {
      const hasBookmaker = opp.bookmakers.some((b) =>
        selectedBookmakers.includes(b.name)
      );
      if (!hasBookmaker) return false;
    }
    if (opp.profit < minProfit) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        status="connected"
        onRefresh={handleRefresh}
        onSettingsClick={() => setSettingsOpen(true)}
        isRefreshing={isRefreshing}
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
        {filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => (
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
