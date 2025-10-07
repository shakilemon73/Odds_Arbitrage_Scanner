import type { OddsApiEvent, Sport } from "@shared/schema";
import { oddsApiEventSchema } from "@shared/schema";
import { z } from "zod";

// ============================================================================
// ODDS PROVIDER INTERFACE & IMPLEMENTATIONS
// ============================================================================

export interface OddsProvider {
  fetchOdds(sports: Sport[], regions?: string[], markets?: string[]): Promise<OddsApiEvent[]>;
  getName(): string;
}

// ============================================================================
// IN-MEMORY CACHE WITH TTL
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    let totalEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalEntries++;
      if (Date.now() - entry.timestamp > entry.ttl) {
        expiredEntries++;
      }
    }
    
    return {
      totalEntries,
      activeEntries: totalEntries - expiredEntries,
      expiredEntries,
    };
  }
}

export const oddsCache = new InMemoryCache();

// ============================================================================
// THE ODDS API PROVIDER
// ============================================================================

export class TheOddsApiProvider implements OddsProvider {
  private apiKey: string;
  private baseUrl: string = "https://api.the-odds-api.com/v4";
  private cacheTtl: number = 60; // seconds

  constructor(apiKey: string, cacheTtl: number = 60) {
    this.apiKey = apiKey;
    this.cacheTtl = cacheTtl;
  }

  getName(): string {
    return "The Odds API";
  }

  private getCacheKey(sports: Sport[], regions: string[], markets: string[]): string {
    return `odds:${sports.join(',')}:${regions.join(',')}:${markets.join(',')}`;
  }

  async fetchOdds(
    sports: Sport[],
    regions: string[] = ["us", "uk", "eu"],
    markets: string[] = ["h2h"]
  ): Promise<OddsApiEvent[]> {
    const cacheKey = this.getCacheKey(sports, regions, markets);
    
    // Check cache first
    const cached = oddsCache.get<OddsApiEvent[]>(cacheKey);
    if (cached) {
      console.log(`[OddsAPI] Cache hit for key: ${cacheKey}`);
      return cached;
    }

    console.log(`[OddsAPI] Fetching fresh data for sports: ${sports.join(', ')}`);

    try {
      // Fetch odds for each sport in parallel
      const promises = sports.map(sport => this.fetchSportOdds(sport, regions, markets));
      const results = await Promise.all(promises);
      
      // Flatten results
      const allEvents = results.flat();
      
      // Validate with Zod
      const validatedEvents = z.array(oddsApiEventSchema).parse(allEvents);
      
      // Cache the results
      oddsCache.set(cacheKey, validatedEvents, this.cacheTtl);
      
      console.log(`[OddsAPI] Fetched ${validatedEvents.length} events, cached for ${this.cacheTtl}s`);
      
      return validatedEvents;
    } catch (error) {
      console.error("[OddsAPI] Error fetching odds:", error);
      throw new Error(`Failed to fetch odds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchSportOdds(
    sport: Sport,
    regions: string[],
    markets: string[]
  ): Promise<OddsApiEvent[]> {
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      regions: regions.join(','),
      markets: markets.join(','),
      oddsFormat: 'decimal',
    });

    const url = `${this.baseUrl}/sports/${sport}/odds?${params.toString()}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
}

// ============================================================================
// MOCK DATA PROVIDER
// ============================================================================

export class MockOddsProvider implements OddsProvider {
  getName(): string {
    return "Mock Provider";
  }

  async fetchOdds(sports: Sport[]): Promise<OddsApiEvent[]> {
    console.log(`[MockProvider] Generating mock data for sports: ${sports.join(', ')}`);
    
    const mockEvents: OddsApiEvent[] = [
      // Soccer - Premier League
      {
        id: "mock_soccer_1",
        sport_key: "soccer_epl",
        sport_title: "Soccer - EPL",
        commence_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        home_team: "Manchester City",
        away_team: "Arsenal",
        bookmakers: [
          {
            key: "bet365",
            title: "Bet365",
            last_update: new Date().toISOString(),
            markets: [{
              key: "h2h",
              last_update: new Date().toISOString(),
              outcomes: [
                { name: "Manchester City", price: 2.10 },
                { name: "Arsenal", price: 3.50 },
                { name: "Draw", price: 3.40 },
              ]
            }]
          },
          {
            key: "draftkings",
            title: "DraftKings",
            last_update: new Date().toISOString(),
            markets: [{
              key: "h2h",
              last_update: new Date().toISOString(),
              outcomes: [
                { name: "Manchester City", price: 2.05 },
                { name: "Arsenal", price: 3.60 },
                { name: "Draw", price: 3.50 },
              ]
            }]
          },
          {
            key: "fanduel",
            title: "FanDuel",
            last_update: new Date().toISOString(),
            markets: [{
              key: "h2h",
              last_update: new Date().toISOString(),
              outcomes: [
                { name: "Manchester City", price: 2.15 },
                { name: "Arsenal", price: 3.40 },
                { name: "Draw", price: 3.60 },
              ]
            }]
          },
        ]
      },
      // Basketball - NBA
      {
        id: "mock_basketball_1",
        sport_key: "basketball_nba",
        sport_title: "Basketball - NBA",
        commence_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        home_team: "Los Angeles Lakers",
        away_team: "Golden State Warriors",
        bookmakers: [
          {
            key: "betmgm",
            title: "BetMGM",
            last_update: new Date().toISOString(),
            markets: [{
              key: "h2h",
              last_update: new Date().toISOString(),
              outcomes: [
                { name: "Los Angeles Lakers", price: 1.95 },
                { name: "Golden State Warriors", price: 2.05 },
              ]
            }]
          },
          {
            key: "caesars",
            title: "Caesars",
            last_update: new Date().toISOString(),
            markets: [{
              key: "h2h",
              last_update: new Date().toISOString(),
              outcomes: [
                { name: "Los Angeles Lakers", price: 1.90 },
                { name: "Golden State Warriors", price: 2.10 },
              ]
            }]
          },
        ]
      },
      // Tennis - ATP
      {
        id: "mock_tennis_1",
        sport_key: "tennis_atp",
        sport_title: "Tennis - ATP",
        commence_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        home_team: "Novak Djokovic",
        away_team: "Carlos Alcaraz",
        bookmakers: [
          {
            key: "pointsbet",
            title: "PointsBet",
            last_update: new Date().toISOString(),
            markets: [{
              key: "h2h",
              last_update: new Date().toISOString(),
              outcomes: [
                { name: "Novak Djokovic", price: 2.25 },
                { name: "Carlos Alcaraz", price: 1.75 },
              ]
            }]
          },
          {
            key: "fanduel",
            title: "FanDuel",
            last_update: new Date().toISOString(),
            markets: [{
              key: "h2h",
              last_update: new Date().toISOString(),
              outcomes: [
                { name: "Novak Djokovic", price: 2.30 },
                { name: "Carlos Alcaraz", price: 1.70 },
              ]
            }]
          },
        ]
      },
      // More profitable arbitrage opportunity - Real Madrid vs Barcelona
      {
        id: "mock_soccer_2",
        sport_key: "soccer_spain_la_liga",
        sport_title: "Soccer - La Liga",
        commence_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        home_team: "Real Madrid",
        away_team: "Barcelona",
        bookmakers: [
          {
            key: "draftkings",
            title: "DraftKings",
            last_update: new Date().toISOString(),
            markets: [{
              key: "h2h",
              last_update: new Date().toISOString(),
              outcomes: [
                { name: "Real Madrid", price: 2.40 },
                { name: "Barcelona", price: 2.90 },
                { name: "Draw", price: 3.50 },
              ]
            }]
          },
          {
            key: "bet365",
            title: "Bet365",
            last_update: new Date().toISOString(),
            markets: [{
              key: "h2h",
              last_update: new Date().toISOString(),
              outcomes: [
                { name: "Real Madrid", price: 2.35 },
                { name: "Barcelona", price: 3.00 },
                { name: "Draw", price: 3.45 },
              ]
            }]
          },
          {
            key: "betmgm",
            title: "BetMGM",
            last_update: new Date().toISOString(),
            markets: [{
              key: "h2h",
              last_update: new Date().toISOString(),
              outcomes: [
                { name: "Real Madrid", price: 2.38 },
                { name: "Barcelona", price: 2.95 },
                { name: "Draw", price: 3.60 },
              ]
            }]
          },
        ]
      },
    ];

    // Filter by requested sports if specific ones are requested
    if (sports.length > 0 && !sports.includes("soccer_epl" as Sport)) {
      return mockEvents.filter(event => sports.includes(event.sport_key as Sport));
    }

    return mockEvents;
  }
}

// ============================================================================
// PROVIDER FACTORY
// ============================================================================

export function createOddsProvider(apiKey?: string, mockMode: boolean = false): OddsProvider {
  if (mockMode) {
    console.log("[ProviderFactory] Using Mock Provider");
    return new MockOddsProvider();
  }
  
  if (!apiKey) {
    console.log("[ProviderFactory] No API key provided, using Mock Provider");
    return new MockOddsProvider();
  }
  
  console.log("[ProviderFactory] Using The Odds API Provider");
  return new TheOddsApiProvider(apiKey, 60);
}
