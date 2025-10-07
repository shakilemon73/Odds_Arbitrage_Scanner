import type { ArbitrageOpportunity, Settings } from "@shared/schema";

// ============================================================================
// IN-MEMORY STORAGE INTERFACE
// ============================================================================
// For arbitrage scanner, we primarily rely on real-time calculations
// Storage is minimal - just for caching opportunities and settings

export interface IStorage {
  // Settings management
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<Settings>): Promise<Settings>;
  
  // Opportunities cache (optional, mainly for performance)
  getCachedOpportunities(): Promise<ArbitrageOpportunity[]>;
  setCachedOpportunities(opportunities: ArbitrageOpportunity[]): Promise<void>;
}

export class MemStorage implements IStorage {
  private settings: Settings;
  private cachedOpportunities: ArbitrageOpportunity[];

  constructor() {
    this.settings = {
      mockMode: process.env.MOCK_ODDS === "true",
      cacheTimeout: 60,
      autoRefreshInterval: 30,
    };
    this.cachedOpportunities = [];
  }

  async getSettings(): Promise<Settings> {
    return { ...this.settings };
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    this.settings = { ...this.settings, ...updates };
    return this.getSettings();
  }

  async getCachedOpportunities(): Promise<ArbitrageOpportunity[]> {
    return [...this.cachedOpportunities];
  }

  async setCachedOpportunities(opportunities: ArbitrageOpportunity[]): Promise<void> {
    this.cachedOpportunities = opportunities;
  }
}

export const storage = new MemStorage();
