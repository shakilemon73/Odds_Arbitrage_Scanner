import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { HistoricalOdds } from "@shared/schema";
import { format } from "date-fns";

interface LineMovementChartProps {
  eventId: string;
  matchName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Color palette for different bookmakers
const BOOKMAKER_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export default function LineMovementChart({
  eventId,
  matchName,
  open,
  onOpenChange,
}: LineMovementChartProps) {
  const { data: historicalOdds, isLoading } = useQuery<HistoricalOdds[]>({
    queryKey: ["/api/historical-odds", eventId],
    enabled: open && !!eventId,
  });

  // Transform data for recharts
  const chartData = (() => {
    if (!historicalOdds || historicalOdds.length === 0) return [];

    // Group by timestamp
    const timestampMap = new Map<string, any>();

    historicalOdds.forEach((odds) => {
      const timestamp = odds.timestamp;
      if (!timestampMap.has(timestamp)) {
        timestampMap.set(timestamp, { timestamp });
      }

      const dataPoint = timestampMap.get(timestamp);
      const key = `${odds.bookmaker}-${odds.outcome}`;
      dataPoint[key] = odds.odds;
    });

    // Convert to array and sort by timestamp
    return Array.from(timestampMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  })();

  // Get unique bookmaker-outcome combinations for lines
  const lines = (() => {
    if (!historicalOdds || historicalOdds.length === 0) return [];

    const uniqueLines = new Set<string>();
    historicalOdds.forEach((odds) => {
      uniqueLines.add(`${odds.bookmaker}-${odds.outcome}`);
    });

    return Array.from(uniqueLines).map((line, index) => ({
      dataKey: line,
      color: BOOKMAKER_COLORS[index % BOOKMAKER_COLORS.length],
      name: line.replace("-", " - "),
    }));
  })();

  const formatXAxis = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "HH:mm");
    } catch {
      return timestamp;
    }
  };

  const formatTooltipLabel = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, HH:mm:ss");
    } catch {
      return timestamp;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-testid="dialog-line-movement">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            Line Movement History
          </DialogTitle>
          <DialogDescription className="text-base">
            {matchName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {isLoading ? (
            <div className="space-y-4" data-testid="skeleton-chart">
              <Skeleton className="h-[400px] w-full" />
              <div className="flex gap-4 justify-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <Card className="bg-muted/30" data-testid="empty-state-chart">
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No historical data available yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Historical odds tracking will begin once this opportunity is detected. Check back later to see how the odds have moved over time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={400} data-testid="chart-line-movement">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatXAxis}
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    label={{
                      value: "Odds",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "hsl(var(--muted-foreground))" },
                    }}
                  />
                  <Tooltip
                    labelFormatter={formatTooltipLabel}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: any) => [value.toFixed(2), ""]}
                  />
                  <Legend
                    wrapperStyle={{
                      paddingTop: "20px",
                    }}
                    iconType="line"
                  />
                  {lines.map((line) => (
                    <Line
                      key={line.dataKey}
                      type="monotone"
                      dataKey={line.dataKey}
                      stroke={line.color}
                      name={line.name}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm">About Line Movement</h4>
                  <p className="text-sm text-muted-foreground">
                    This chart shows how odds have changed over time for each bookmaker and outcome. Sharp movements may indicate where professional bettors are placing their money, or reflect changes in market sentiment.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
