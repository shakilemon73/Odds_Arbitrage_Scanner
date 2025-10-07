import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createOddsProvider, oddsCache } from "./odds-provider";
import { findAllArbitrageOpportunities } from "./arbitrage-engine";
import { 
  getOddsRequestSchema,
  type Sport,
  type GetOddsResponse,
  type HealthCheckResponse 
} from "@shared/schema";
import { z } from "zod";

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

      // Get settings to determine mock mode
      const settings = await storage.getSettings();
      const apiKey = process.env.ODDS_API_KEY || req.headers['x-api-key'] as string;
      
      // Create odds provider (mock or real)
      const provider = createOddsProvider(apiKey, settings.mockMode);
      
      console.log(`[API] Fetching odds using ${provider.getName()}`);
      
      // Default sports if none specified
      const sports = (validated.sports || ["soccer_epl", "basketball_nba", "tennis_atp"]) as Sport[];
      
      // Fetch odds from provider
      const oddsData = await provider.fetchOdds(sports);
      
      // Calculate arbitrage opportunities
      const opportunities = findAllArbitrageOpportunities(
        oddsData,
        validated.minProfit || 0
      );

      // Filter by bookmakers if specified
      let filteredOpportunities = opportunities;
      if (validated.bookmakers && validated.bookmakers.length > 0) {
        filteredOpportunities = opportunities.filter(opp => 
          opp.bookmakers.some(b => validated.bookmakers!.includes(b.name))
        );
      }

      // Cache opportunities in storage
      await storage.setCachedOpportunities(filteredOpportunities);

      const response: GetOddsResponse = {
        opportunities: filteredOpportunities,
        count: filteredOpportunities.length,
        cachedAt: new Date().toISOString(),
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
  // GET /api/healthz - Health check
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
