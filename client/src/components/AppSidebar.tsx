import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  TrendingUp, 
  Trophy, 
  Circle, 
  CircleDot,
  Shield,
  Snowflake,
  Dumbbell,
  Settings,
  X,
  Sparkles,
  ChevronRight,
  Percent,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { BookmakerWithCount } from "@/components/FilterBar";

const SPORTS = [
  { value: "all", label: "All Sports", Icon: Trophy, description: "All available sports" },
  { value: "soccer", label: "Soccer", Icon: Circle, description: "Football matches" },
  { value: "basketball", label: "Basketball", Icon: CircleDot, description: "NBA & more" },
  { value: "football", label: "Football", Icon: Shield, description: "NFL & NCAA" },
  { value: "baseball", label: "Baseball", Icon: Circle, description: "MLB games" },
  { value: "hockey", label: "Hockey", Icon: Snowflake, description: "NHL matches" },
  { value: "mma", label: "MMA", Icon: Dumbbell, description: "UFC & more" },
];

const TIME_FILTERS = [
  { value: "all", label: "All Times", description: "Show all games" },
  { value: "5min", label: "Next 5 Minutes", description: "Games starting soon" },
  { value: "10min", label: "Next 10 Minutes", description: "Very soon" },
  { value: "30min", label: "Next 30 Minutes", description: "Starting soon" },
  { value: "1hr", label: "Next Hour", description: "Within an hour" },
  { value: "6hr", label: "Next 6 Hours", description: "Today's games" },
  { value: "12hr", label: "Next 12 Hours", description: "Half day" },
  { value: "24hr", label: "Next 24 Hours", description: "Tomorrow" },
  { value: "tomorrow", label: "Tomorrow", description: "Next 48 hours" },
  { value: "week", label: "This Week", description: "Next 7 days" },
];

interface AppSidebarProps {
  selectedSport: string;
  selectedBookmakers: string[];
  minProfit: number;
  selectedTimeFilter: string;
  availableBookmakers: BookmakerWithCount[];
  onSportChange: (sport: string) => void;
  onBookmakerToggle: (bookmaker: string) => void;
  onMinProfitChange: (profit: number) => void;
  onTimeFilterChange: (timeFilter: string) => void;
  onClearFilters: () => void;
  onSettingsClick: () => void;
}

export function AppSidebar({
  selectedSport,
  selectedBookmakers,
  minProfit,
  selectedTimeFilter,
  availableBookmakers = [],
  onSportChange,
  onBookmakerToggle,
  onMinProfitChange,
  onTimeFilterChange,
  onClearFilters,
  onSettingsClick,
}: AppSidebarProps) {
  const hasFilters = selectedSport !== "all" || selectedBookmakers.length > 0 || minProfit > 0 || selectedTimeFilter !== "all";
  const activeFiltersCount = (selectedSport !== "all" ? 1 : 0) + selectedBookmakers.length + (minProfit > 0 ? 1 : 0) + (selectedTimeFilter !== "all" ? 1 : 0);

  return (
    <Sidebar data-testid="sidebar-main" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "relative bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl",
            "shadow-lg shadow-primary/20 transition-transform hover:scale-105"
          )}>
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
            <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-primary-foreground animate-pulse" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-sidebar-foreground tracking-tight" data-testid="text-sidebar-title">
              DELLTA
            </h2>
            <p className="text-sm text-muted-foreground font-medium">Arbitrage Scanner</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6 space-y-8">
        {/* Sport Category Section */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 pb-4">
            <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5" />
              Sport Category
            </SidebarGroupLabel>
            {selectedSport !== "all" && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                1
              </Badge>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {SPORTS.map((sport) => {
                const isActive = selectedSport === sport.value;
                return (
                  <SidebarMenuItem key={sport.value}>
                    <SidebarMenuButton
                      onClick={() => onSportChange(sport.value)}
                      isActive={isActive}
                      data-testid={`button-sport-${sport.value}`}
                      className={cn(
                        "gap-3 h-11 px-3 rounded-lg font-medium transition-all",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                      )}
                      tooltip={sport.description}
                    >
                      <sport.Icon className={cn(
                        "h-4.5 w-4.5 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="flex-1 text-sm">{sport.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4 text-primary" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Min Profit Section */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 pb-4">
            <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
              <Percent className="h-3.5 w-3.5" />
              Min Profit
            </SidebarGroupLabel>
            <Badge 
              variant={minProfit > 0 ? "default" : "outline"} 
              className={cn(
                "text-xs h-6 px-2 font-bold tabular-nums",
                minProfit > 0 && "bg-primary/15 text-primary border-primary/30"
              )}
              data-testid="badge-min-profit"
            >
              {minProfit.toFixed(1)}%
            </Badge>
          </div>
          <SidebarGroupContent className="px-2 space-y-4">
            <Slider
              value={[minProfit]}
              onValueChange={(value) => onMinProfitChange(value[0])}
              max={10}
              step={0.1}
              className="w-full"
              data-testid="slider-min-profit"
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground font-medium px-1">
              <span className={cn(minProfit === 0 && "text-primary font-semibold")}>0%</span>
              <span className={cn(minProfit >= 4.5 && minProfit <= 5.5 && "text-primary font-semibold")}>5%</span>
              <span className={cn(minProfit === 10 && "text-primary font-semibold")}>10%</span>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Time Filter Section */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 pb-4">
            <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Time Filter
            </SidebarGroupLabel>
            {selectedTimeFilter !== "all" && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                1
              </Badge>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {TIME_FILTERS.map((timeFilter) => {
                const isActive = selectedTimeFilter === timeFilter.value;
                return (
                  <SidebarMenuItem key={timeFilter.value}>
                    <SidebarMenuButton
                      onClick={() => onTimeFilterChange(timeFilter.value)}
                      isActive={isActive}
                      data-testid={`button-time-filter-${timeFilter.value}`}
                      className={cn(
                        "gap-3 h-11 px-3 rounded-lg font-medium transition-all",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                      )}
                      tooltip={timeFilter.description}
                    >
                      <Clock className={cn(
                        "h-4.5 w-4.5 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="flex-1 text-sm">{timeFilter.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4 text-primary" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bookmakers Section */}
        {availableBookmakers.length > 0 && (
          <>
            <Separator />
            <SidebarGroup>
              <div className="flex items-center justify-between px-2 pb-4">
                <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  Bookmakers
                </SidebarGroupLabel>
                <div className="flex items-center gap-1.5">
                  {selectedBookmakers.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {selectedBookmakers.length}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                    {availableBookmakers.reduce((sum, b) => sum + b.count, 0)}
                  </Badge>
                </div>
              </div>
              <SidebarGroupContent className="px-2">
                <div className="flex flex-wrap gap-2">
                  {availableBookmakers.map(({ name, count }) => {
                    const isSelected = selectedBookmakers.includes(name);
                    return (
                      <Badge
                        key={name}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer text-xs h-8 px-3 font-medium hover-elevate active-elevate-2 transition-all",
                          isSelected && "bg-primary text-primary-foreground border-primary shadow-sm"
                        )}
                        onClick={() => onBookmakerToggle(name)}
                        data-testid={`badge-bookmaker-${name.toLowerCase()}`}
                      >
                        {name}
                        <span className={cn(
                          "ml-1.5 opacity-70 font-semibold",
                          isSelected && "opacity-90"
                        )}>
                          {count}
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Clear Filters */}
        {hasFilters && (
          <>
            <Separator />
            <SidebarGroup>
              <SidebarGroupContent className="px-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  className="w-full gap-2 h-10 font-medium"
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4" />
                  Clear {activeFiltersCount} Filter{activeFiltersCount !== 1 ? 's' : ''}
                </Button>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsClick}
          className="w-full gap-3 justify-start h-11 font-medium"
          data-testid="button-sidebar-settings"
        >
          <Settings className="h-4.5 w-4.5" />
          Settings & API Keys
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
