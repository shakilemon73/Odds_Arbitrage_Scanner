import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock, Target, Sparkles, ArrowUpRight } from "lucide-react";
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
      label: "Total Opportunities",
      value: isLoading ? "--" : totalOpportunities.toString(),
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      change: totalOpportunities > 0 ? "Active" : "None",
      trend: "up" as const,
    },
    {
      label: "Avg Profit",
      value: isLoading ? "--" : `${avgProfit.toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
      change: avgProfit > 1 ? "Good" : "Low",
      trend: "up" as const,
    },
    {
      label: "Max Potential",
      value: isLoading ? "--" : `$${maxPotential.toFixed(0)}`,
      icon: DollarSign,
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
      change: `On $${(totalOpportunities * 100).toFixed(0)}`,
      trend: null,
    },
    {
      label: "Last Update",
      value: isLoading ? "--" : lastUpdated,
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-border/50",
      change: "Live data",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className={cn(
            "relative overflow-hidden group hover-elevate transition-all duration-300",
            "border-2", 
            stat.borderColor
          )} 
          data-testid={`card-stat-${index}`}
        >
          {/* Background gradient */}
          <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            "bg-gradient-to-br from-transparent to-black/5 dark:to-white/5"
          )} />
          
          <div className="relative p-6 space-y-4">
            {/* Icon and Label */}
            <div className="flex items-center justify-between">
              <div className={cn(
                "p-3 rounded-xl transition-all duration-300",
                stat.bgColor,
                "group-hover:scale-110"
              )}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              {stat.trend && (
                <ArrowUpRight className={cn("h-4 w-4", stat.color, "opacity-50")} />
              )}
            </div>

            {/* Label */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                {stat.label}
              </p>
              
              {/* Value */}
              <p className={cn(
                "text-3xl font-bold tracking-tight tabular-nums",
                isLoading && "animate-pulse",
                stat.color
              )} data-testid={`text-stat-value-${index}`}>
                {stat.value}
              </p>
              
              {/* Change indicator */}
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                {stat.trend && <Sparkles className="h-3 w-3" />}
                {stat.change}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
