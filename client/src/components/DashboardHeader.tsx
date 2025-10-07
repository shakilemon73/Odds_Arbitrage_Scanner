import { useEffect } from "react";
import { RefreshCw, Settings, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusIndicator from "./StatusIndicator";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  status: "connected" | "disconnected" | "cached";
  onRefresh: () => void;
  onSettingsClick: () => void;
  isRefreshing?: boolean;
}

export default function DashboardHeader({
  status,
  onRefresh,
  onSettingsClick,
  isRefreshing = false,
}: DashboardHeaderProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        onRefresh();
      } else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        onSettingsClick();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onRefresh, onSettingsClick]);

  return (
    <header 
      className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm"
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-app-title">
                  Arbitrage Scanner
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Find guaranteed profit opportunities
                </p>
              </div>
            </div>
            <StatusIndicator status={status} className="hidden md:flex" />
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={onRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh"
              aria-label={isRefreshing ? "Refreshing opportunities" : "Refresh opportunities (Cmd/Ctrl+R)"}
              title={isRefreshing ? "Refreshing..." : "Refresh (Cmd/Ctrl+R)"}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4 transition-transform", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              data-testid="button-settings"
              aria-label="Open settings (Cmd/Ctrl+,)"
              title="Settings (Cmd/Ctrl+,)"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
