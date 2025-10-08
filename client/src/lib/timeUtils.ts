import { 
  parseISO, 
  differenceInMinutes, 
  differenceInHours, 
  differenceInDays,
  addMinutes,
  addHours,
  addDays,
  isBefore,
  isAfter 
} from "date-fns";
import type { TimeFilter, GameStatus } from "@shared/schema";
import type { ArbitrageOpportunity } from "@shared/schema";

/**
 * Determines the game status based on commence time
 * @param commenceTime - ISO 8601 datetime string
 * @returns "live" | "starting-soon" | "upcoming"
 */
export function getGameStatus(commenceTime?: string): GameStatus {
  if (!commenceTime) return "upcoming";
  
  const now = new Date();
  const gameTime = parseISO(commenceTime);
  const minutesUntilStart = differenceInMinutes(gameTime, now);
  const hoursUntilStart = differenceInHours(gameTime, now);
  
  // Game is live if it started but less than 3 hours ago
  if (minutesUntilStart < 0 && hoursUntilStart > -3) {
    return "live";
  }
  
  // Game is starting soon if less than 30 minutes until start
  if (minutesUntilStart >= 0 && minutesUntilStart < 30) {
    return "starting-soon";
  }
  
  return "upcoming";
}

/**
 * Checks if a game is currently live (started but < 3 hours ago)
 * @param commenceTime - ISO 8601 datetime string
 * @returns boolean
 */
export function isGameLive(commenceTime?: string): boolean {
  return getGameStatus(commenceTime) === "live";
}

/**
 * Checks if a game is starting soon (< 30 minutes until start)
 * @param commenceTime - ISO 8601 datetime string
 * @returns boolean
 */
export function isStartingSoon(commenceTime?: string): boolean {
  return getGameStatus(commenceTime) === "starting-soon";
}

/**
 * Gets formatted time until game start
 * @param commenceTime - ISO 8601 datetime string
 * @returns Formatted string like "2h 15m" or "Starting now" or "Live"
 */
export function getTimeUntilStart(commenceTime?: string): string {
  if (!commenceTime) return "Time TBA";
  
  const now = new Date();
  const gameTime = parseISO(commenceTime);
  const minutesUntilStart = differenceInMinutes(gameTime, now);
  const hoursUntilStart = differenceInHours(gameTime, now);
  const daysUntilStart = differenceInDays(gameTime, now);
  
  // Game is live
  if (minutesUntilStart < 0 && hoursUntilStart > -3) {
    const minutesElapsed = Math.abs(minutesUntilStart);
    if (minutesElapsed < 60) {
      return `Live (${minutesElapsed}m)`;
    }
    const hoursElapsed = Math.abs(hoursUntilStart);
    return `Live (${hoursElapsed}h ${minutesElapsed % 60}m)`;
  }
  
  // Game has passed
  if (minutesUntilStart < 0) {
    return "Finished";
  }
  
  // Game is starting very soon
  if (minutesUntilStart < 1) {
    return "Starting now";
  }
  
  // Less than 1 hour
  if (hoursUntilStart < 1) {
    return `${minutesUntilStart}m`;
  }
  
  // Less than 24 hours
  if (daysUntilStart < 1) {
    const remainingMinutes = minutesUntilStart % 60;
    return `${hoursUntilStart}h ${remainingMinutes}m`;
  }
  
  // 1 day or more
  if (daysUntilStart === 1) {
    return "Tomorrow";
  }
  
  return `${daysUntilStart} days`;
}

/**
 * Filters opportunities by time range
 * @param opportunities - Array of arbitrage opportunities
 * @param timeFilter - Time filter to apply
 * @returns Filtered opportunities
 */
export function filterByTimeRange(
  opportunities: ArbitrageOpportunity[],
  timeFilter: TimeFilter
): ArbitrageOpportunity[] {
  if (timeFilter === "all") {
    return opportunities;
  }
  
  const now = new Date();
  let endTime: Date;
  
  switch (timeFilter) {
    case "5min":
      endTime = addMinutes(now, 5);
      break;
    case "10min":
      endTime = addMinutes(now, 10);
      break;
    case "30min":
      endTime = addMinutes(now, 30);
      break;
    case "1hr":
      endTime = addHours(now, 1);
      break;
    case "6hr":
      endTime = addHours(now, 6);
      break;
    case "12hr":
      endTime = addHours(now, 12);
      break;
    case "24hr":
      endTime = addHours(now, 24);
      break;
    case "tomorrow":
      endTime = addHours(now, 48);
      break;
    case "week":
      endTime = addDays(now, 7);
      break;
    default:
      return opportunities;
  }
  
  return opportunities.filter(opp => {
    if (!opp.commenceTime) return false;
    
    const gameTime = parseISO(opp.commenceTime);
    
    // Include live games (started but < 3 hours ago)
    const hoursUntilStart = differenceInHours(gameTime, now);
    if (hoursUntilStart < 0 && hoursUntilStart > -3) {
      return true;
    }
    
    // Include games that start before the end time
    return isBefore(gameTime, endTime) && isAfter(gameTime, now);
  });
}

/**
 * Sorts opportunities by start time (earliest first, with live games at top)
 * @param opportunities - Array of arbitrage opportunities
 * @returns Sorted opportunities
 */
export function sortByStartTime(
  opportunities: ArbitrageOpportunity[]
): ArbitrageOpportunity[] {
  return [...opportunities].sort((a, b) => {
    // Handle missing commence times
    if (!a.commenceTime && !b.commenceTime) return 0;
    if (!a.commenceTime) return 1;
    if (!b.commenceTime) return -1;
    
    const aTime = parseISO(a.commenceTime);
    const bTime = parseISO(b.commenceTime);
    const now = new Date();
    
    const aStatus = getGameStatus(a.commenceTime);
    const bStatus = getGameStatus(b.commenceTime);
    
    // Live games first
    if (aStatus === "live" && bStatus !== "live") return -1;
    if (bStatus === "live" && aStatus !== "live") return 1;
    
    // Then starting soon
    if (aStatus === "starting-soon" && bStatus !== "starting-soon") return -1;
    if (bStatus === "starting-soon" && aStatus !== "starting-soon") return 1;
    
    // Then by start time (earliest first)
    return aTime.getTime() - bTime.getTime();
  });
}
