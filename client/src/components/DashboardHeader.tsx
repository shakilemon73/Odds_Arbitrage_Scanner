import { useEffect } from "react";
import { RefreshCw, Settings, TrendingUp, Sparkles } from "lucide-react";
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
      className={cn(
        "sticky top-0 z-50 border-b border-border/50",
        "bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60",
        "shadow-sm"
      )}
      role="banner"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" aria-hidden="true" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg",
                "shadow-lg shadow-primary/20"
              )}>
                <TrendingUp className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                <Sparkles className="absolute -top-0.5 -right-0.5 h-3 w-3 text-primary-foreground animate-pulse" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent" data-testid="text-app-title">
                  Arbitrage Scanner
                </h1>
                <p className="text-xs text-muted-foreground font-medium hidden sm:block">
                  Find guaranteed profit opportunities
                </p>
              </div>
            </div>
            <StatusIndicator status={status} className="hidden lg:flex" />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={onRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh"
              aria-label={isRefreshing ? "Refreshing opportunities" : "Refresh opportunities (Cmd/Ctrl+R)"}
              title={isRefreshing ? "Refreshing..." : "Refresh (Cmd/Ctrl+R)"}
              className={cn(
                "gap-2 font-semibold",
                "hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors duration-200"
              )}
            >
              <RefreshCw className={cn("h-4 w-4 transition-transform duration-500", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              data-testid="button-settings"
              aria-label="Open settings (Cmd/Ctrl+,)"
              title="Settings (Cmd/Ctrl+,)"
              className="hover:bg-primary/10 dark:hover:bg-primary/20"
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
