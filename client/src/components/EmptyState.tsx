import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, RefreshCw, Search, Filter } from "lucide-react";

interface EmptyStateProps {
  onRefresh: () => void;
}

export default function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[500px] text-center px-4"
      role="status"
      aria-live="polite"
    >
      <Card className="p-12 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="rounded-full bg-primary/10 p-8 transition-transform hover:scale-105" aria-hidden="true">
                <TrendingUp className="h-16 w-16 text-primary" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-2 border-2 border-background shadow-lg">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold" data-testid="text-empty-title">
              No Arbitrage Opportunities Found
            </h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto" data-testid="text-empty-description">
              We couldn't find any profitable opportunities matching your current filters. Try adjusting your criteria or refresh to check for new opportunities.
            </p>
          </div>

          <div className="pt-4 space-y-4">
            <Button 
              size="lg"
              onClick={onRefresh} 
              data-testid="button-empty-refresh"
              aria-label="Refresh to check for new arbitrage opportunities"
              className="gap-2"
            >
              <RefreshCw className="h-5 w-5" aria-hidden="true" />
              Refresh Data
            </Button>

            <div className="pt-6 border-t">
              <div className="flex items-start gap-3 text-sm text-muted-foreground max-w-md mx-auto text-left">
                <Filter className="h-5 w-5 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground mb-1">Quick Tips:</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Try lowering the minimum profit percentage</li>
                    <li>• Select "All Sports" to see more opportunities</li>
                    <li>• Remove bookmaker filters to expand results</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
