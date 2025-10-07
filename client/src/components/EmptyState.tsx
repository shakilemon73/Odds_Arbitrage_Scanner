import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

interface EmptyStateProps {
  onRefresh: () => void;
}

export default function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="rounded-full bg-muted p-6 mb-4">
        <TrendingUp className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2" data-testid="text-empty-title">
        No Arbitrage Opportunities Found
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md" data-testid="text-empty-description">
        We couldn't find any arbitrage opportunities matching your filters. Try adjusting your filters or refresh to check for new opportunities.
      </p>
      <Button onClick={onRefresh} data-testid="button-empty-refresh">
        <span className="material-icons text-base mr-2">refresh</span>
        Refresh Data
      </Button>
    </div>
  );
}
