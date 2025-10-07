import { useState } from "react";
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
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { BookmakerWithCount } from "@/components/FilterBar";

const SPORTS = [
  { value: "all", label: "All Sports", Icon: Trophy },
  { value: "soccer", label: "Soccer", Icon: Circle },
  { value: "basketball", label: "Basketball", Icon: CircleDot },
  { value: "football", label: "Football", Icon: Shield },
  { value: "baseball", label: "Baseball", Icon: Circle },
  { value: "hockey", label: "Hockey", Icon: Snowflake },
  { value: "mma", label: "MMA", Icon: Dumbbell },
];

interface AppSidebarProps {
  selectedSport: string;
  selectedBookmakers: string[];
  minProfit: number;
  availableBookmakers: BookmakerWithCount[];
  onSportChange: (sport: string) => void;
  onBookmakerToggle: (bookmaker: string) => void;
  onMinProfitChange: (profit: number) => void;
  onClearFilters: () => void;
  onSettingsClick: () => void;
}

export function AppSidebar({
  selectedSport,
  selectedBookmakers,
  minProfit,
  availableBookmakers = [],
  onSportChange,
  onBookmakerToggle,
  onMinProfitChange,
  onClearFilters,
  onSettingsClick,
}: AppSidebarProps) {
  const hasFilters = selectedSport !== "all" || selectedBookmakers.length > 0 || minProfit > 0;

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "relative bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-lg",
            "shadow-lg shadow-primary/20"
          )}>
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
            <Sparkles className="absolute -top-0.5 -right-0.5 h-3 w-3 text-primary-foreground animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground" data-testid="text-sidebar-title">
              DELLTA
            </h2>
            <p className="text-xs text-muted-foreground">Arbitrage Scanner</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <div className="flex items-center justify-between px-3 pb-2">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Sport Category
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {SPORTS.map((sport) => (
                <SidebarMenuItem key={sport.value}>
                  <SidebarMenuButton
                    onClick={() => onSportChange(sport.value)}
                    isActive={selectedSport === sport.value}
                    data-testid={`button-sport-${sport.value}`}
                    className="gap-3"
                  >
                    <sport.Icon className="h-4 w-4" />
                    <span className="flex-1">{sport.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <div className="flex items-center justify-between px-3 pb-3">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Min Profit
            </SidebarGroupLabel>
            <Badge variant="outline" className="text-xs" data-testid="badge-min-profit">
              {minProfit.toFixed(1)}%
            </Badge>
          </div>
          <SidebarGroupContent className="px-3">
            <Slider
              value={[minProfit]}
              onValueChange={(value) => onMinProfitChange(value[0])}
              max={10}
              step={0.1}
              className="w-full"
              data-testid="slider-min-profit"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>0%</span>
              <span>5%</span>
              <span>10%</span>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {availableBookmakers.length > 0 && (
          <SidebarGroup className="mt-6">
            <div className="flex items-center justify-between px-3 pb-3">
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Bookmakers
              </SidebarGroupLabel>
              <Badge variant="outline" className="text-xs">
                {availableBookmakers.reduce((sum, b) => sum + b.count, 0)}
              </Badge>
            </div>
            <SidebarGroupContent className="px-3">
              <div className="flex flex-wrap gap-2">
                {availableBookmakers.map(({ name, count }) => {
                  const isSelected = selectedBookmakers.includes(name);
                  return (
                    <Badge
                      key={name}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-xs hover-elevate active-elevate-2",
                        isSelected && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => onBookmakerToggle(name)}
                      data-testid={`badge-bookmaker-${name.toLowerCase()}`}
                    >
                      {name}
                      <span className="ml-1.5 opacity-70">{count}</span>
                    </Badge>
                  );
                })}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasFilters && (
          <SidebarGroup className="mt-6">
            <SidebarGroupContent className="px-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="w-full gap-2"
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsClick}
          className="w-full gap-2 justify-start"
          data-testid="button-sidebar-settings"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
