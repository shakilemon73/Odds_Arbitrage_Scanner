import { z } from "zod";

// ============================================================================
// CORE TYPES & SCHEMAS FOR ARBITRAGE SCANNER
// ============================================================================

// Bookmaker odds for a specific outcome
export const bookmakerOddsSchema = z.object({
  name: z.string(),
  outcome: z.string(),
  odds: z.number().positive(),
  stake: z.number().nonnegative(),
  ev: z.number().optional(),
  evDollars: z.number().optional(),
});

export type BookmakerOdds = z.infer<typeof bookmakerOddsSchema>;

// Market types (defined before use)
export const marketTypeSchema = z.enum(["h2h", "spreads", "totals"]);
export type MarketType = z.infer<typeof marketTypeSchema>;

// Middle opportunity info
export const middleInfoSchema = z.object({
  isMiddle: z.boolean(),
  line1: z.number().optional(),
  line2: z.number().optional(),
  winScenarios: z.array(z.string()).optional(),
});

export type MiddleInfo = z.infer<typeof middleInfoSchema>;

// Arbitrage opportunity
export const arbitrageOpportunitySchema = z.object({
  id: z.string(),
  sport: z.string(),
  match: z.string(),
  bookmakers: z.array(bookmakerOddsSchema).min(2),
  profit: z.number(),
  timestamp: z.string(),
  eventId: z.string().optional(),
  commenceTime: z.string().optional(),
  dataSource: z.enum(["live", "mock", "cached"]).optional(),
  hold: z.number().optional(), // Task 6: Market hold percentage
  isMiddle: z.boolean().optional(), // Task 5: Is this a middle opportunity
  middleInfo: middleInfoSchema.optional(), // Task 5: Middle details
  isPositiveEV: z.boolean().optional(), // Task 8: Is this +EV
  marketType: marketTypeSchema.optional(), // h2h, spreads, or totals
});

export type ArbitrageOpportunity = z.infer<typeof arbitrageOpportunitySchema>;

// The Odds API raw response types
export const oddsApiOutcomeSchema = z.object({
  name: z.string(),
  price: z.number(),
});

export const oddsApiBookmakerSchema = z.object({
  key: z.string(),
  title: z.string(),
  last_update: z.string(),
  markets: z.array(z.object({
    key: z.string(),
    last_update: z.string(),
    outcomes: z.array(oddsApiOutcomeSchema),
  })),
});

export const oddsApiEventSchema = z.object({
  id: z.string(),
  sport_key: z.string(),
  sport_title: z.string(),
  commence_time: z.string(),
  home_team: z.string(),
  away_team: z.string(),
  bookmakers: z.array(oddsApiBookmakerSchema),
});

export type OddsApiEvent = z.infer<typeof oddsApiEventSchema>;
export type OddsApiBookmaker = z.infer<typeof oddsApiBookmakerSchema>;
export type OddsApiOutcome = z.infer<typeof oddsApiOutcomeSchema>;

// Sports configuration
// 'upcoming' is always valid and returns next 8 games + live games across all sports
export const sportSchema = z.enum([
  "upcoming",
  "americanfootball_nfl",
  "americanfootball_ncaaf",
  "basketball_nba",
  "basketball_ncaab",
  "baseball_mlb",
  "icehockey_nhl",
  "soccer_epl",
  "soccer_spain_la_liga", 
  "soccer_germany_bundesliga",
  "soccer_italy_serie_a",
  "soccer_france_ligue_one",
  "soccer_usa_mls",
  "tennis_atp",
  "tennis_wta",
  "mma_mixed_martial_arts",
  "aussierules_afl",
  "rugbyleague_nrl",
]);

export type Sport = z.infer<typeof sportSchema>;

// General sport categories for user-friendly filters (mapped to specific leagues in routes)
export const generalSportSchema = z.enum([
  "all",
  "soccer",
  "basketball",
  "football",
  "baseball",
  "hockey",
  "mma",
]);

export type GeneralSport = z.infer<typeof generalSportSchema>;

// Flexible sport input that accepts both general categories and specific league codes
export const sportInputSchema = z.union([sportSchema, generalSportSchema]);
export type SportInput = z.infer<typeof sportInputSchema>;

// API request/response schemas
export const getOddsRequestSchema = z.object({
  sports: z.array(sportInputSchema).optional(),
  minProfit: z.number().min(0).max(100).optional(),
  bookmakers: z.array(z.string()).optional(),
});

export type GetOddsRequest = z.infer<typeof getOddsRequestSchema>;

export const getOddsResponseSchema = z.object({
  opportunities: z.array(arbitrageOpportunitySchema),
  count: z.number(),
  cachedAt: z.string().optional(),
  isFromCache: z.boolean().optional(),
  cacheAge: z.number().optional(), // Age in minutes
});

export type GetOddsResponse = z.infer<typeof getOddsResponseSchema>;

// Health check response
export const healthCheckResponseSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  timestamp: z.string(),
  services: z.object({
    api: z.boolean(),
    cache: z.boolean(),
  }),
});

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;

// Historical odds tracking (Task 7)
export const historicalOddsSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  bookmaker: z.string(),
  outcome: z.string(),
  odds: z.number(),
  timestamp: z.string(),
  marketType: marketTypeSchema.optional(),
});

export type HistoricalOdds = z.infer<typeof historicalOddsSchema>;

export const insertHistoricalOddsSchema = historicalOddsSchema.omit({ id: true });
export type InsertHistoricalOdds = z.infer<typeof insertHistoricalOddsSchema>;

// Bet tracking (Task 12)
export const betSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  sport: z.string(),
  match: z.string(),
  bookmakers: z.array(z.object({
    name: z.string(),
    outcome: z.string(),
    odds: z.number(),
    stake: z.number(),
  })),
  status: z.enum(["pending", "won", "lost"]),
  profit: z.number(),
  timestamp: z.string(),
  closingOdds: z.array(z.object({
    bookmaker: z.string(),
    outcome: z.string(),
    odds: z.number(),
  })).optional(),
  clv: z.number().optional(), // Closing Line Value
});

export type Bet = z.infer<typeof betSchema>;

export const insertBetSchema = betSchema.omit({ id: true });
export type InsertBet = z.infer<typeof insertBetSchema>;

// Promo tracking (Task 14)
export const promoTypeSchema = z.enum(["deposit_bonus", "free_bet", "odds_boost", "risk_free", "other"]);
export type PromoType = z.infer<typeof promoTypeSchema>;

export const promoSchema = z.object({
  id: z.string(),
  bookmaker: z.string(),
  type: promoTypeSchema,
  value: z.number(), // Dollar value or percentage
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
  timestamp: z.string(),
});

export type Promo = z.infer<typeof promoSchema>;

export const insertPromoSchema = promoSchema.omit({ id: true, timestamp: true });
export type InsertPromo = z.infer<typeof insertPromoSchema>;

// Notification preferences (Task 11)
export const notificationPreferencesSchema = z.object({
  enabled: z.boolean().default(false),
  minProfit: z.number().min(0).max(100).default(2),
  sound: z.boolean().default(true),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

// Settings/Configuration
export const settingsSchema = z.object({
  apiKey: z.string().optional(),
  mockMode: z.boolean().default(false),
  cacheTimeout: z.number().min(10).max(300).default(60),
  autoRefreshInterval: z.number().min(10).max(300).default(30),
  showMockData: z.boolean().default(true),
  showLiveData: z.boolean().default(true),
  sports: z.array(sportSchema).optional(),
  bookmakerPreferences: z.array(z.string()).optional(), // Task 9: Enabled bookmakers
  minEV: z.number().min(0).max(100).default(1), // Task 8: Minimum EV filter
  notificationPreferences: notificationPreferencesSchema.optional(), // Task 11
});

export type Settings = z.infer<typeof settingsSchema>;
