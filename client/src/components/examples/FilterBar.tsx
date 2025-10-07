import FilterBar from "../FilterBar";
import { useState } from "react";

export default function FilterBarExample() {
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([]);
  const [minProfit, setMinProfit] = useState(0);

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

  return (
    <FilterBar
      selectedSport={selectedSport}
      selectedBookmakers={selectedBookmakers}
      minProfit={minProfit}
      onSportChange={setSelectedSport}
      onBookmakerToggle={handleBookmakerToggle}
      onMinProfitChange={setMinProfit}
      onClearFilters={handleClearFilters}
    />
  );
}
