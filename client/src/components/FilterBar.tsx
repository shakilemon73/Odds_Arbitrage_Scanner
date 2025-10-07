import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Trophy, 
  Circle, 
  Dribbble, 
  CircleDot,
  Shield,
  Snowflake,
  Swords,
  Filter,
  TrendingUp
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

const SPORTS = [
  { value: "all", label: "All Sports", Icon: Trophy },
  { value: "soccer", label: "Soccer", Icon: Circle },
  { value: "basketball", label: "Basketball", Icon: Dribbble },
  { value: "football", label: "Football", Icon: Shield },
  { value: "baseball", label: "Baseball", Icon: CircleDot },
  { value: "hockey", label: "Hockey", Icon: Snowflake },
  { value: "mma", label: "MMA", Icon: Swords },
];

export interface BookmakerWithCount {
  name: string;
  count: number;
}

interface FilterBarProps {
  selectedSport: string;
  selectedBookmakers: string[];
  minProfit: number;
  availableBookmakers: BookmakerWithCount[];
  onSportChange: (sport: string) => void;
  onBookmakerToggle: (bookmaker: string) => void;
  onMinProfitChange: (profit: number) => void;
  onClearFilters: () => void;
}

export default function FilterBar({
  selectedSport,
  selectedBookmakers,
  minProfit,
  availableBookmakers = [],
  onSportChange,
  onBookmakerToggle,
  onMinProfitChange,
  onClearFilters,
}: FilterBarProps) {
  const hasFilters = selectedSport !== "all" || selectedBookmakers.length > 0 || minProfit > 0;

  return (
    <div className="border-b bg-background" role="region" aria-label="Filters">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Filter className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Filter Opportunities</h2>
                <p className="text-sm text-muted-foreground">Customize your search criteria</p>
              </div>
            </div>
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                data-testid="button-clear-filters"
                aria-label="Clear all filters"
                className="gap-2"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Sport Category
              </label>
              <Select value={selectedSport} onValueChange={onSportChange}>
                <SelectTrigger className="w-full sm:w-[240px]" data-testid="select-sport" aria-label="Select sport to filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((sport) => (
                    <SelectItem key={sport.value} value={sport.value}>
                      <div className="flex items-center gap-3">
                        <sport.Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{sport.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableBookmakers.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <CircleDot className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Bookmakers
                  <span className="text-xs text-muted-foreground font-normal">
                    ({selectedBookmakers.length > 0 ? `${selectedBookmakers.length} selected` : 'All'})
                  </span>
                </label>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Bookmaker filters">
                  {availableBookmakers.map((bookmaker) => (
                    <Badge
                      key={bookmaker.name}
                      variant={selectedBookmakers.includes(bookmaker.name) ? "default" : "outline"}
                      className="cursor-pointer hover-elevate transition-all px-4 py-2 text-sm font-medium"
                      onClick={() => onBookmakerToggle(bookmaker.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onBookmakerToggle(bookmaker.name);
                        }
                      }}
                      tabIndex={0}
                      role="checkbox"
                      aria-checked={selectedBookmakers.includes(bookmaker.name)}
                      aria-label={`Filter by ${bookmaker.name}, ${bookmaker.count} opportunities`}
                      data-testid={`badge-bookmaker-${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {bookmaker.name}
                      <span className="ml-1.5 opacity-70">({bookmaker.count})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="profit-slider" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Minimum Profit Percentage
                </label>
                <span className="text-lg font-bold font-mono tabular-nums text-primary" data-testid="text-profit-value" aria-live="polite">
                  {minProfit.toFixed(1)}%
                </span>
              </div>
              <div className="pt-2">
                <Slider
                  id="profit-slider"
                  value={[minProfit]}
                  onValueChange={([value]) => onMinProfitChange(value)}
                  max={10}
                  step={0.1}
                  className="w-full"
                  data-testid="slider-min-profit"
                  aria-label={`Minimum profit filter, currently ${minProfit.toFixed(1)}%`}
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>5%</span>
                  <span>10%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
