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
  const stats = [
    {
      label: "Total Opportunities",
      value: isLoading ? "--" : totalOpportunities.toString(),
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Avg Profit",
      value: isLoading ? "--" : `${avgProfit.toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Max Potential",
      value: isLoading ? "--" : `$${(totalOpportunities * 100 * avgProfit / 100).toFixed(0)}`,
      icon: DollarSign,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Last Update",
      value: isLoading ? "--" : lastUpdated,
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4" data-testid={`card-stat-${index}`}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-lg", stat.bgColor)}>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {stat.label}
              </p>
              <p className={cn(
                "text-xl font-bold mt-1 truncate",
                isLoading && "animate-pulse"
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
