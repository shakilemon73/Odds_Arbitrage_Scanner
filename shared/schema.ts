import { z } from "zod";
import { pgTable, text, integer, serial, timestamp, jsonb, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

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

// Time filter types for filtering opportunities by start time
export const timeFilterSchema = z.enum([
  "all",
  "5min",
  "10min",
  "30min",
  "1hr",
  "6hr",
  "12hr",
  "24hr",
  "tomorrow",
  "week"
]);
export type TimeFilter = z.infer<typeof timeFilterSchema>;

// Game status based on commence time
export const gameStatusSchema = z.enum(["live", "starting-soon", "upcoming"]);
export type GameStatus = z.infer<typeof gameStatusSchema>;

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
  timeFilter: timeFilterSchema.optional(),
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

// Event schema for stored events
export const eventSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  sportKey: z.string(),
  sportTitle: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  commenceTime: z.string(),
  bookmakers: z.array(oddsApiBookmakerSchema),
  createdAt: z.string(),
  lastUpdated: z.string(),
});

export type Event = z.infer<typeof eventSchema>;

export const insertEventSchema = eventSchema.omit({ id: true, createdAt: true, lastUpdated: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;

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

// ============================================================================
// DRIZZLE DATABASE TABLES
// ============================================================================

// Settings table - stores user preferences and configuration
export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  apiKey: text("api_key"),
  mockMode: boolean("mock_mode").default(false).notNull(),
  cacheTimeout: integer("cache_timeout").default(60).notNull(),
  autoRefreshInterval: integer("auto_refresh_interval").default(30).notNull(),
  showMockData: boolean("show_mock_data").default(true).notNull(),
  showLiveData: boolean("show_live_data").default(true).notNull(),
  sports: jsonb("sports").$type<string[]>(),
  bookmakerPreferences: jsonb("bookmaker_preferences").$type<string[]>(),
  minEV: decimal("min_ev").default("1").notNull(),
  notificationPreferences: jsonb("notification_preferences").$type<NotificationPreferences>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SettingsRow = typeof settingsTable.$inferSelect;
export type InsertSettings = typeof settingsTable.$inferInsert;

// Historical odds table - tracks odds changes over time
export const historicalOddsTable = pgTable("historical_odds", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull(),
  bookmaker: text("bookmaker").notNull(),
  outcome: text("outcome").notNull(),
  odds: decimal("odds").notNull(),
  marketType: text("market_type"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type HistoricalOddsRow = typeof historicalOddsTable.$inferSelect;
export type InsertHistoricalOddsRow = typeof historicalOddsTable.$inferInsert;

// Bets table - tracks placed bets
export const betsTable = pgTable("bets", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull(),
  sport: text("sport").notNull(),
  match: text("match").notNull(),
  bookmakers: jsonb("bookmakers").$type<Array<{
    name: string;
    outcome: string;
    odds: number;
    stake: number;
  }>>().notNull(),
  status: text("status").$type<"pending" | "won" | "lost">().notNull(),
  profit: decimal("profit").notNull(),
  closingOdds: jsonb("closing_odds").$type<Array<{
    bookmaker: string;
    outcome: string;
    odds: number;
  }>>(),
  clv: decimal("clv"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type BetRow = typeof betsTable.$inferSelect;
export type InsertBetRow = typeof betsTable.$inferInsert;

// Promos table - tracks bookmaker promotions
export const promosTable = pgTable("promos", {
  id: serial("id").primaryKey(),
  bookmaker: text("bookmaker").notNull(),
  type: text("type").$type<"deposit_bonus" | "free_bet" | "odds_boost" | "risk_free" | "other">().notNull(),
  value: decimal("value").notNull(),
  expiryDate: timestamp("expiry_date"),
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type PromoRow = typeof promosTable.$inferSelect;
export type InsertPromoRow = typeof promosTable.$inferInsert;

// Events table - stores sports events/matches from API
export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().unique(),
  sportKey: text("sport_key").notNull(),
  sportTitle: text("sport_title").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  commenceTime: timestamp("commence_time").notNull(),
  bookmakers: jsonb("bookmakers").$type<OddsApiBookmaker[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export type EventRow = typeof eventsTable.$inferSelect;
export type InsertEventRow = typeof eventsTable.$inferInsert;
