import { Button } from "@/components/ui/button";
import { TrendingUp, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  onRefresh: () => void;
}

export default function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[400px] text-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-full bg-muted p-6 mb-6 transition-transform hover:scale-105" aria-hidden="true">
        <TrendingUp className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-3" data-testid="text-empty-title">
        No Opportunities Found
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md text-sm" data-testid="text-empty-description">
        Adjust filters or refresh for new opportunities
      </p>
      <Button 
        onClick={onRefresh} 
        data-testid="button-empty-refresh"
        aria-label="Refresh to check for new arbitrage opportunities"
        className="h-11 px-6"
      >
        <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
        Refresh Data
      </Button>
    </div>
  );
}
