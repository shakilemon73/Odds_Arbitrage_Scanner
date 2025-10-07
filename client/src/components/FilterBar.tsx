import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const SPORTS = [
  { value: "all", label: "All Sports", icon: "sports" },
  { value: "soccer", label: "Soccer", icon: "sports_soccer" },
  { value: "basketball", label: "Basketball", icon: "sports_basketball" },
  { value: "tennis", label: "Tennis", icon: "sports_tennis" },
];

const BOOKMAKERS = [
  "Bet365",
  "DraftKings",
  "FanDuel",
  "BetMGM",
  "Caesars",
  "PointsBet",
];

interface FilterBarProps {
  selectedSport: string;
  selectedBookmakers: string[];
  minProfit: number;
  onSportChange: (sport: string) => void;
  onBookmakerToggle: (bookmaker: string) => void;
  onMinProfitChange: (profit: number) => void;
  onClearFilters: () => void;
}

export default function FilterBar({
  selectedSport,
  selectedBookmakers,
  minProfit,
  onSportChange,
  onBookmakerToggle,
  onMinProfitChange,
  onClearFilters,
}: FilterBarProps) {
  const hasFilters = selectedSport !== "all" || selectedBookmakers.length > 0 || minProfit > 0;

  return (
    <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedSport} onValueChange={onSportChange}>
              <SelectTrigger className="w-[160px]" data-testid="select-sport">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPORTS.map((sport) => (
                  <SelectItem key={sport.value} value={sport.value}>
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-base">{sport.icon}</span>
                      {sport.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {BOOKMAKERS.map((bookmaker) => (
                <Badge
                  key={bookmaker}
                  variant={selectedBookmakers.includes(bookmaker) ? "default" : "outline"}
                  className="cursor-pointer hover-elevate"
                  onClick={() => onBookmakerToggle(bookmaker)}
                  data-testid={`badge-bookmaker-${bookmaker.toLowerCase()}`}
                >
                  {bookmaker}
                </Badge>
              ))}
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                data-testid="button-clear-filters"
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Min Profit:</span>
            <Slider
              value={[minProfit]}
              onValueChange={([value]) => onMinProfitChange(value)}
              max={10}
              step={0.1}
              className="w-full max-w-xs"
              data-testid="slider-min-profit"
            />
            <span className="text-sm font-mono font-medium min-w-[3rem]" data-testid="text-profit-value">
              {minProfit.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
