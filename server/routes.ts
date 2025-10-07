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
  type HealthCheckResponse 
} from "@shared/schema";
import { z } from "zod";

// ============================================================================
// SPORT CATEGORY MAPPING
// ============================================================================

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
      };

      // Validate with Zod
      const validated = getOddsRequestSchema.parse(queryParams);

      // Get settings to determine data sources
      const settings = await storage.getSettings();
      
      // Get API key from environment or request header
      const envApiKey = process.env.ODDS_API_KEY;
      const headerApiKey = req.headers['x-api-key'] as string | undefined;
      const apiKey = envApiKey || headerApiKey || undefined;
      
      console.log(`[API] API Key source: ${envApiKey ? 'environment' : headerApiKey ? 'header' : 'none'}`);
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

  const httpServer = createServer(app);

  return httpServer;
}
