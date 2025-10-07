import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Trophy, 
  Circle, 
  Dribbble, 
  Target, 
  CircleDot,
  Shield,
  Snowflake,
  Swords
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

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
    <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="region" aria-label="Filters">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedSport} onValueChange={onSportChange}>
              <SelectTrigger className="w-[160px] !h-11" data-testid="select-sport" aria-label="Select sport to filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPORTS.map((sport) => (
                  <SelectItem key={sport.value} value={sport.value} className="!min-h-11">
                    <div className="flex items-center gap-2">
                      <sport.Icon className="h-4 w-4" aria-hidden="true" />
                      {sport.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Bookmaker filters">
              {availableBookmakers.map((bookmaker) => (
                <Badge
                  key={bookmaker.name}
                  variant={selectedBookmakers.includes(bookmaker.name) ? "default" : "outline"}
                  className="cursor-pointer hover-elevate transition-all !h-11 !px-4 !py-0 inline-flex items-center"
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
                  {bookmaker.name} ({bookmaker.count})
                </Badge>
              ))}
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                onClick={onClearFilters}
                data-testid="button-clear-filters"
                className="ml-auto h-11 px-4"
                aria-label="Clear all filters"
              >
                <X className="h-4 w-4 mr-1" aria-hidden="true" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label htmlFor="profit-slider" className="text-sm text-muted-foreground whitespace-nowrap">
              Min Profit:
            </label>
            <Slider
              id="profit-slider"
              value={[minProfit]}
              onValueChange={([value]) => onMinProfitChange(value)}
              max={10}
              step={0.1}
              className="w-full max-w-xs [&_[role=slider]]:!h-11 [&_[role=slider]]:!w-11"
              data-testid="slider-min-profit"
              aria-label={`Minimum profit filter, currently ${minProfit.toFixed(1)}%`}
            />
            <span className="text-sm font-mono font-semibold min-w-[3rem]" data-testid="text-profit-value" aria-live="polite">
              {minProfit.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
