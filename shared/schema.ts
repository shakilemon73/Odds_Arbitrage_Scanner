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

// Market types
export const marketTypeSchema = z.enum(["h2h", "spreads", "totals"]);
export type MarketType = z.infer<typeof marketTypeSchema>;

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

// Settings/Configuration
export const settingsSchema = z.object({
  apiKey: z.string().optional(),
  mockMode: z.boolean().default(false),
  cacheTimeout: z.number().min(10).max(300).default(60),
  sports: z.array(sportSchema).optional(),
});

export type Settings = z.infer<typeof settingsSchema>;
