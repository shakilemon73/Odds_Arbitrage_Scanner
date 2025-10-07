import { useEffect } from "react";
import { RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusIndicator from "./StatusIndicator";
import ThemeToggle from "./ThemeToggle";

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
      className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg sm:text-xl font-semibold" data-testid="text-app-title">
              Arbitrage Scanner
            </h1>
            <StatusIndicator status={status} className="hidden sm:flex" />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh"
              aria-label={isRefreshing ? "Refreshing opportunities" : "Refresh opportunities (Cmd/Ctrl+R)"}
              title={isRefreshing ? "Refreshing..." : "Refresh (Cmd/Ctrl+R)"}
              className="h-11 w-11 p-0"
            >
              <RefreshCw className={cn("h-4 w-4 transition-transform", isRefreshing && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              onClick={onSettingsClick}
              data-testid="button-settings"
              aria-label="Open settings (Cmd/Ctrl+,)"
              title="Settings (Cmd/Ctrl+,)"
              className="h-11 w-11 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
