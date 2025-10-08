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
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Avg Profit",
      value: isLoading ? "--" : `${avgProfit.toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Max Potential",
      value: isLoading ? "--" : `$${maxPotential.toFixed(0)}`,
      icon: DollarSign,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Last Update",
      value: isLoading ? "--" : lastUpdated,
      icon: Clock,
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className="border-0 shadow-sm hover-elevate transition-all" 
          data-testid={`card-stat-${index}`}
        >
          <div className="p-4 sm:p-5">
            <div className={cn("inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {stat.label}
            </p>
            <p className={cn(
              "text-2xl sm:text-3xl font-bold tracking-tight",
              isLoading && "animate-pulse",
              stat.color
            )} data-testid={`text-stat-value-${index}`}>
              {stat.value}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
