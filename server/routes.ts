import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createOddsProvider, oddsCache } from "./odds-provider";
import { findAllArbitrageOpportunities } from "./arbitrage-engine";
import { 
  getOddsRequestSchema,
  type Sport,
  type SportInput,
  type GetOddsResponse,
  type HealthCheckResponse,
  type TimeFilter 
} from "@shared/schema";
import { z } from "zod";

// ============================================================================
// SPORT CATEGORY MAPPING
// ============================================================================

/**
 * Filters opportunities by time range based on commence_time
 */
function filterByTimeRange(opportunities: any[], timeFilter?: TimeFilter): any[] {
  if (!timeFilter || timeFilter === "all") {
    return opportunities;
  }
  
  const now = new Date();
  let endTime: Date;
  
  switch (timeFilter) {
    case "5min":
      endTime = new Date(now.getTime() + 5 * 60 * 1000);
      break;
    case "10min":
      endTime = new Date(now.getTime() + 10 * 60 * 1000);
      break;
    case "30min":
      endTime = new Date(now.getTime() + 30 * 60 * 1000);
      break;
    case "1hr":
      endTime = new Date(now.getTime() + 60 * 60 * 1000);
      break;
    case "6hr":
      endTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      break;
    case "12hr":
      endTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      break;
    case "24hr":
      endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      break;
    case "tomorrow":
      endTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      break;
    case "week":
      endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      return opportunities;
  }
  
  return opportunities.filter(opp => {
    if (!opp.commenceTime) return false;
    
    const gameTime = new Date(opp.commenceTime);
    
    // Include live games (started but < 3 hours ago)
    const hoursUntilStart = (gameTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilStart < 0 && hoursUntilStart > -3) {
      return true;
    }
    
    // Include games that start before the end time
    return gameTime < endTime && gameTime > now;
  });
}

/**
 * Maps general sport categories to their specific league codes
 */
function mapSportInputToLeagues(sportInput: SportInput): Sport[] {
  const sportMap: Record<string, Sport[]> = {
    "soccer": [
      "soccer_epl",
      "soccer_spain_la_liga",
      "soccer_germany_bundesliga",
      "soccer_italy_serie_a",
      "soccer_france_ligue_one",
      "soccer_usa_mls"
    ],
    "basketball": ["basketball_nba", "basketball_ncaab"],
    "football": ["americanfootball_nfl", "americanfootball_ncaaf"],
    "baseball": ["baseball_mlb"],
    "hockey": ["icehockey_nhl"],
    "mma": ["mma_mixed_martial_arts"],
  };

  // If it's a general category, return the mapped leagues
  if (sportInput in sportMap) {
    return sportMap[sportInput];
  }

  // If it's "all", return ALL available sport leagues
  if (sportInput === "all") {
    return [
      "soccer_epl", "soccer_spain_la_liga", "soccer_germany_bundesliga", 
      "soccer_italy_serie_a", "soccer_france_ligue_one", "soccer_usa_mls",
      "basketball_nba", "basketball_ncaab",
      "americanfootball_nfl", "americanfootball_ncaaf",
      "baseball_mlb",
      "icehockey_nhl",
      "mma_mixed_martial_arts"
    ];
  }
  
  // If it's "upcoming", return upcoming
  if (sportInput === "upcoming") {
    return ["upcoming"];
  }

  // Otherwise it's already a specific league code, return as-is
  return [sportInput as Sport];
}

// ============================================================================
// API ROUTES FOR ARBITRAGE SCANNER
// ============================================================================

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ========================================
  // GET /api/odds - Fetch arbitrage opportunities
  // ========================================
  app.get("/api/odds", async (req, res) => {
    try {
      // Parse and validate query parameters
      const queryParams = {
        sports: req.query.sports 
          ? (typeof req.query.sports === 'string' ? req.query.sports.split(',') : req.query.sports)
          : undefined,
        minProfit: req.query.minProfit ? parseFloat(req.query.minProfit as string) : 0,
        bookmakers: req.query.bookmakers
          ? (typeof req.query.bookmakers === 'string' ? req.query.bookmakers.split(',') : req.query.bookmakers)
          : undefined,
        timeFilter: req.query.timeFilter as TimeFilter | undefined,
      };

      // Validate with Zod
      const validated = getOddsRequestSchema.parse(queryParams);

      // Get settings to determine data sources
      const settings = await storage.getSettings();
      
      // Get API key from request header or environment variable
      const headerApiKey = req.headers['x-api-key'] as string | undefined;
      const envApiKey = process.env.THE_ODDS_API_KEY;
      const apiKey = headerApiKey || envApiKey;
      
      console.log(`[API] API Key source: ${headerApiKey ? 'header' : envApiKey ? 'environment' : 'none'}`);
      console.log(`[API] Show Mock: ${settings.showMockData}, Show Live: ${settings.showLiveData}`);
      
      // Map general sport categories to specific leagues
      const sportInputs = validated.sports || ["upcoming"];
      const sports = sportInputs.flatMap(mapSportInputToLeagues);
      const uniqueSports = Array.from(new Set(sports)) as Sport[];
      
      console.log(`[API] Fetching odds for sports:`, uniqueSports);
      
      let allOpportunities: any[] = [];
      let isFromCache = false;
      let cacheAge: number | undefined = undefined;
      
      // Fetch mock data if enabled
      if (settings.showMockData) {
        const mockProvider = new (await import('./odds-provider')).MockOddsProvider();
        const mockResult = await mockProvider.fetchOdds(uniqueSports);
        const mockOpportunities = findAllArbitrageOpportunities(
          mockResult.events,
          validated.minProfit || 0
        ).map(opp => ({ ...opp, dataSource: 'mock' as const }));
        allOpportunities.push(...mockOpportunities);
        console.log(`[API] Added ${mockOpportunities.length} mock opportunities`);
      }
      
      // Fetch live data if enabled and API key is available
      if (settings.showLiveData && apiKey && !settings.mockMode) {
        try {
          const liveProvider = createOddsProvider(apiKey, false);
          const liveResult = await liveProvider.fetchOdds(uniqueSports);
          
          // Save events to database
          console.log(`[API] Saving ${liveResult.events.length} events to database...`);
          for (const event of liveResult.events) {
            try {
              await storage.saveEvent({
                eventId: event.id,
                sportKey: event.sport_key,
                sportTitle: event.sport_title,
                homeTeam: event.home_team,
                awayTeam: event.away_team,
                commenceTime: event.commence_time,
                bookmakers: event.bookmakers,
              });
            } catch (saveError) {
              console.error(`[API] Error saving event ${event.id}:`, saveError);
            }
          }
          console.log(`[API] Events saved to database`);
          
          const liveOpportunities = findAllArbitrageOpportunities(
            liveResult.events,
            validated.minProfit || 0
          ).map(opp => ({ 
            ...opp, 
            dataSource: liveResult.isFromCache ? 'cached' as const : 'live' as const 
          }));
          allOpportunities.push(...liveOpportunities);
          isFromCache = liveResult.isFromCache;
          cacheAge = liveResult.cacheAge;
          console.log(`[API] Added ${liveOpportunities.length} live opportunities (cached: ${isFromCache})`);
        } catch (error) {
          console.error(`[API] Error fetching live data:`, error);
        }
      }
      
      // Calculate combined opportunities
      const opportunities = allOpportunities;

      // Filter by bookmakers if specified
      let filteredOpportunities = opportunities;
      if (validated.bookmakers && validated.bookmakers.length > 0) {
        filteredOpportunities = opportunities.filter(opp => 
          opp.bookmakers.some((b: any) => validated.bookmakers!.includes(b.name))
        );
      }

      // Filter by time range if specified
      filteredOpportunities = filterByTimeRange(filteredOpportunities, validated.timeFilter);

      // Cache opportunities in storage
      await storage.setCachedOpportunities(filteredOpportunities);

      const response: GetOddsResponse = {
        opportunities: filteredOpportunities,
        count: filteredOpportunities.length,
        cachedAt: new Date().toISOString(),
        isFromCache,
        cacheAge,
      };

      res.json(response);
    } catch (error) {
      console.error("[API] Error in /api/odds:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid request parameters",
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // ========================================
  // Task 5: GET /api/middles - Fetch middle opportunities
  // ========================================
  app.get("/api/middles", async (req, res) => {
    try {
      const { findMiddles } = await import('./arbitrage-engine');
      
      // Get settings to determine data sources
      const settings = await storage.getSettings();
      const headerApiKey = req.headers['x-api-key'] as string | undefined;
      const apiKey = headerApiKey || process.env.THE_ODDS_API_KEY;
      
      // Map general sport categories to specific leagues
      const sportInputs = req.query.sports 
        ? (typeof req.query.sports === 'string' ? req.query.sports.split(',') : req.query.sports)
        : ["upcoming"];
      const sports = (sportInputs as string[]).flatMap(mapSportInputToLeagues);
      const uniqueSports = Array.from(new Set(sports)) as Sport[];
      
      let allEvents: any[] = [];
      
      // Fetch events from enabled sources
      if (settings.showMockData) {
        const mockProvider = new (await import('./odds-provider')).MockOddsProvider();
        const mockResult = await mockProvider.fetchOdds(uniqueSports);
        allEvents.push(...mockResult.events);
      }
      
      if (settings.showLiveData && apiKey && !settings.mockMode) {
        try {
          const liveProvider = createOddsProvider(apiKey, false);
          const liveResult = await liveProvider.fetchOdds(uniqueSports);
          allEvents.push(...liveResult.events);
        } catch (error) {
          console.error(`[API] Error fetching live data for middles:`, error);
        }
      }
      
      const middles = findMiddles(allEvents);
      
      res.json({
        opportunities: middles,
        count: middles.length,
        cachedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[API] Error in /api/middles:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // ========================================
  // Task 8: GET /api/positive-ev - Fetch +EV opportunities
  // ========================================
  app.get("/api/positive-ev", async (req, res) => {
    try {
      const { findPositiveEVOpportunities } = await import('./arbitrage-engine');
      
      const minEV = req.query.minEV ? parseFloat(req.query.minEV as string) : 2;
      
      // Get settings to determine data sources
      const settings = await storage.getSettings();
      const headerApiKey = req.headers['x-api-key'] as string | undefined;
      const apiKey = headerApiKey || process.env.THE_ODDS_API_KEY;
      
      // Map general sport categories to specific leagues
      const sportInputs = req.query.sports 
        ? (typeof req.query.sports === 'string' ? req.query.sports.split(',') : req.query.sports)
        : ["upcoming"];
      const sports = (sportInputs as string[]).flatMap(mapSportInputToLeagues);
      const uniqueSports = Array.from(new Set(sports)) as Sport[];
      
      let allEvents: any[] = [];
      
      // Fetch events from enabled sources
      if (settings.showMockData) {
        const mockProvider = new (await import('./odds-provider')).MockOddsProvider();
        const mockResult = await mockProvider.fetchOdds(uniqueSports);
        allEvents.push(...mockResult.events);
      }
      
      if (settings.showLiveData && apiKey && !settings.mockMode) {
        try {
          const liveProvider = createOddsProvider(apiKey, false);
          const liveResult = await liveProvider.fetchOdds(uniqueSports);
          allEvents.push(...liveResult.events);
        } catch (error) {
          console.error(`[API] Error fetching live data for +EV:`, error);
        }
      }
      
      const positiveEVOpps = findPositiveEVOpportunities(allEvents, minEV);
      
      res.json({
        opportunities: positiveEVOpps,
        count: positiveEVOpps.length,
        cachedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[API] Error in /api/positive-ev:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // ========================================
  // GET /healthz - Health check (spec requirement)
  // ========================================
  app.get("/healthz", async (req, res) => {
    try {
      const cacheStats = oddsCache.getStats();
      
      const response: HealthCheckResponse = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          api: true,
          cache: cacheStats.activeEntries >= 0,
        },
      };

      res.json(response);
    } catch (error) {
      const response: HealthCheckResponse = {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          api: false,
          cache: false,
        },
      };

      res.status(503).json(response);
    }
  });

  // ========================================
  // GET /api/healthz - Health check (alias)
  // ========================================
  app.get("/api/healthz", async (req, res) => {
    try {
      const cacheStats = oddsCache.getStats();
      
      const response: HealthCheckResponse = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          api: true,
          cache: cacheStats.activeEntries >= 0,
        },
      };

      res.json(response);
    } catch (error) {
      const response: HealthCheckResponse = {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          api: false,
          cache: false,
        },
      };

      res.status(503).json(response);
    }
  });

  // ========================================
  // GET /api/settings - Get current settings
  // ========================================
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // ========================================
  // POST /api/settings - Update settings
  // ========================================
  app.post("/api/settings", async (req, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updateSettings(updates);
      res.json(settings);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // ========================================
  // GET /api/cache/stats - Cache statistics
  // ========================================
  app.get("/api/cache/stats", (req, res) => {
    try {
      const stats = oddsCache.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // ========================================
  // POST /api/cache/clear - Clear cache
  // ========================================
  app.post("/api/cache/clear", (req, res) => {
    try {
      oddsCache.clear();
      res.json({ message: "Cache cleared successfully" });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // ========================================
  // Task 7: Historical Odds Endpoints
  // ========================================
  app.get("/api/historical-odds/:eventId", async (req, res) => {
    try {
      const { eventId } = req.params;
      const historicalOdds = await storage.getHistoricalOdds(eventId);
      res.json(historicalOdds);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // ========================================
  // Task 12: Bet Tracking Endpoints
  // ========================================
  app.get("/api/bets", async (req, res) => {
    try {
      const bets = await storage.getBets();
      res.json(bets);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.get("/api/bets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const bet = await storage.getBet(id);
      if (!bet) {
        return res.status(404).json({ message: "Bet not found" });
      }
      res.json(bet);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.post("/api/bets", async (req, res) => {
    try {
      const bet = await storage.saveBet(req.body);
      res.status(201).json(bet);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.patch("/api/bets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const bet = await storage.updateBet(id, req.body);
      res.json(bet);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.delete("/api/bets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBet(id);
      res.json({ message: "Bet deleted successfully" });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // ========================================
  // Task 14: Promo Tracking Endpoints
  // ========================================
  app.get("/api/promos", async (req, res) => {
    try {
      const promos = await storage.getPromos();
      res.json(promos);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.get("/api/promos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const promo = await storage.getPromo(id);
      if (!promo) {
        return res.status(404).json({ message: "Promo not found" });
      }
      res.json(promo);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.post("/api/promos", async (req, res) => {
    try {
      const promo = await storage.savePromo(req.body);
      res.status(201).json(promo);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.patch("/api/promos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const promo = await storage.updatePromo(id, req.body);
      res.json(promo);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.delete("/api/promos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePromo(id);
      res.json({ message: "Promo deleted successfully" });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // ========================================
  // Event Storage Endpoints
  // ========================================
  app.get("/api/events", async (req, res) => {
    try {
      const thisWeekOnly = req.query.thisWeekOnly === 'true';
      const events = await storage.getEvents({ thisWeekOnly });
      res.json({
        events,
        count: events.length,
        thisWeekOnly,
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.get("/api/events/:eventId", async (req, res) => {
    try {
      const { eventId } = req.params;
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // ========================================
  // Cleanup Endpoint - Remove old events
  // ========================================
  app.post("/api/cleanup", async (req, res) => {
    try {
      const deletedCount = await storage.cleanupOldEvents();
      res.json({
        message: "Cleanup completed successfully",
        deletedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
