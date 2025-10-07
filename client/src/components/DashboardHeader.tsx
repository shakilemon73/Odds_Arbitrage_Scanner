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
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg sm:text-xl font-semibold" data-testid="text-app-title">
              Arbitrage Scanner
            </h1>
            <StatusIndicator status={status} className="hidden sm:flex" />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh"
              className="h-9 w-9"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              data-testid="button-settings"
              className="h-9 w-9"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
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
