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
  TrendingUp,
  Sparkles
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
import { cn } from "@/lib/utils";

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
    <div className="border-b border-border/50 bg-muted/30 dark:bg-muted/10" role="region" aria-label="Filters">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Card className={cn(
          "p-5 space-y-5 border-border/50",
          "bg-card/50 backdrop-blur-sm"
        )}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "bg-gradient-to-br from-primary/20 to-primary/10 p-2 rounded-lg",
                "ring-1 ring-primary/20"
              )}>
                <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  Filter Opportunities
                  {hasFilters && <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" aria-hidden="true" />}
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Refine your search to find the best opportunities
                </p>
              </div>
            </div>
            {hasFilters && (
              <Button
                variant="outline"
                size="default"
                onClick={onClearFilters}
                data-testid="button-clear-filters"
                aria-label="Clear all filters"
                className={cn(
                  "gap-2 font-semibold",
                  "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200"
                )}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Sport Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                <Trophy className="h-4 w-4 text-primary" aria-hidden="true" />
                Sport Category
              </label>
              <Select value={selectedSport} onValueChange={onSportChange}>
                <SelectTrigger 
                  className={cn(
                    "w-full font-semibold",
                    "hover:bg-muted/50 transition-colors duration-200"
                  )} 
                  data-testid="select-sport" 
                  aria-label="Select sport to filter"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((sport) => (
                    <SelectItem key={sport.value} value={sport.value}>
                      <div className="flex items-center gap-3">
                        <sport.Icon className="h-4 w-4" aria-hidden="true" />
                        <span className="font-medium">{sport.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Minimum Profit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="profit-slider" className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
                  Min Profit
                </label>
                <div className={cn(
                  "px-3 py-1.5 rounded-lg font-black font-mono tabular-nums text-lg",
                  "bg-primary/10 text-primary ring-1 ring-primary/20"
                )} 
                data-testid="text-profit-value" 
                aria-live="polite">
                  {minProfit.toFixed(1)}%
                </div>
              </div>
              <div className="pt-2 space-y-2">
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
                <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                  <span>0%</span>
                  <span>5%</span>
                  <span>10%</span>
                </div>
              </div>
            </div>

            {/* Bookmakers Info */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                <CircleDot className="h-4 w-4 text-primary" aria-hidden="true" />
                Bookmakers
              </label>
              <div className={cn(
                "flex items-center justify-center h-11 px-4 rounded-lg",
                "bg-muted/50 border border-border/50"
              )}>
                <span className="text-xs font-semibold text-muted-foreground">
                  {selectedBookmakers.length > 0 
                    ? `${selectedBookmakers.length} of ${availableBookmakers.length} selected` 
                    : `All ${availableBookmakers.length} available`}
                </span>
              </div>
            </div>
          </div>

          {/* Bookmakers Grid */}
          {availableBookmakers.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Bookmaker filters">
                {availableBookmakers.map((bookmaker) => {
                  const isSelected = selectedBookmakers.includes(bookmaker.name);
                  return (
                    <Badge
                      key={bookmaker.name}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all duration-200 px-3 py-1.5 text-xs font-bold",
                        isSelected 
                          ? "shadow-lg shadow-primary/20 ring-1 ring-primary/30" 
                          : "hover-elevate hover:border-primary/30"
                      )}
                      onClick={() => onBookmakerToggle(bookmaker.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onBookmakerToggle(bookmaker.name);
                        }
                      }}
                      tabIndex={0}
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={`Filter by ${bookmaker.name}, ${bookmaker.count} opportunities`}
                      data-testid={`badge-bookmaker-${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {bookmaker.name}
                      <span className={cn(
                        "ml-2 px-1.5 py-0.5 rounded text-xs font-black",
                        isSelected ? "bg-primary-foreground/20" : "bg-muted"
                      )}>
                        {bookmaker.count}
                      </span>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
