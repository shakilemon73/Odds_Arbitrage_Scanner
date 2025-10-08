import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsOverviewProps {
  totalOpportunities: number;
  avgProfit: number;
  lastUpdated: string;
  isLoading?: boolean;
}

export function StatsOverview({ 
  totalOpportunities, 
  avgProfit, 
  lastUpdated,
  isLoading = false 
}: StatsOverviewProps) {
  const maxPotential = totalOpportunities * 100 * avgProfit / 100;
  
  const stats = [
    {
      label: "Opportunities",
      value: isLoading ? "--" : totalOpportunities.toString(),
      icon: Target,
      color: "text-primary",
    },
    {
      label: "Avg Profit",
      value: isLoading ? "--" : `${avgProfit.toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Max Potential",
      value: isLoading ? "--" : `$${maxPotential.toFixed(0)}`,
      icon: DollarSign,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Last Update",
      value: isLoading ? "--" : lastUpdated,
      icon: Clock,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className="hover-elevate transition-all duration-200" 
          data-testid={`card-stat-${index}`}
        >
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium">
                {stat.label}
              </p>
              <p className={cn(
                "text-xl sm:text-2xl font-bold tracking-tight",
                isLoading && "animate-pulse",
                stat.color
              )} data-testid={`text-stat-value-${index}`}>
                {stat.value}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
