import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CacheIndicatorProps {
  isFromCache?: boolean;
  cacheAge?: number;
}

export default function CacheIndicator({ isFromCache, cacheAge }: CacheIndicatorProps) {
  if (!isFromCache) return null;

  const ageText = cacheAge
    ? cacheAge < 60
      ? `${cacheAge}m old`
      : `${Math.floor(cacheAge / 60)}h old`
    : "cached";

  return (
    <Badge
      variant="outline"
      className="gap-1.5 !h-11 bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
      data-testid="badge-cache-indicator"
      aria-label={`Using cached data from ${ageText}`}
    >
      <Database className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Cached data ({ageText})</span>
    </Badge>
  );
}
