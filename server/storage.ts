import type { 
  ArbitrageOpportunity, 
  Settings, 
  HistoricalOdds, 
  InsertHistoricalOdds,
  Bet,
  InsertBet,
  Promo,
  InsertPromo
} from "@shared/schema";

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
  
  // Task 7: Historical odds tracking
  saveHistoricalOdds(odds: InsertHistoricalOdds): Promise<HistoricalOdds>;
  getHistoricalOdds(eventId: string): Promise<HistoricalOdds[]>;
  
  // Task 12: Bet tracking
  saveBet(bet: InsertBet): Promise<Bet>;
  getBets(): Promise<Bet[]>;
  getBet(id: string): Promise<Bet | null>;
  updateBet(id: string, updates: Partial<Bet>): Promise<Bet>;
  deleteBet(id: string): Promise<void>;
  
  // Task 14: Promo tracking
  savePromo(promo: InsertPromo): Promise<Promo>;
  getPromos(): Promise<Promo[]>;
  getPromo(id: string): Promise<Promo | null>;
  updatePromo(id: string, updates: Partial<Promo>): Promise<Promo>;
  deletePromo(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private settings: Settings;
  private cachedOpportunities: ArbitrageOpportunity[];
  private historicalOdds: Map<string, HistoricalOdds[]>; // Key: eventId
  private bets: Map<string, Bet>; // Key: bet id
  private promos: Map<string, Promo>; // Key: promo id

  constructor() {
    this.settings = {
      mockMode: process.env.MOCK_ODDS === "true",
      cacheTimeout: 60,
      autoRefreshInterval: 30,
      showMockData: true,
      showLiveData: true,
      minEV: 1,
      bookmakerPreferences: [],
      notificationPreferences: {
        enabled: false,
        minProfit: 2,
        sound: true,
      },
    };
    this.cachedOpportunities = [];
    this.historicalOdds = new Map();
    this.bets = new Map();
    this.promos = new Map();
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

  // Task 7: Historical odds
  async saveHistoricalOdds(data: InsertHistoricalOdds): Promise<HistoricalOdds> {
    const id = `odds-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const odds: HistoricalOdds = { ...data, id };
    
    const existing = this.historicalOdds.get(data.eventId) || [];
    this.historicalOdds.set(data.eventId, [...existing, odds]);
    
    return odds;
  }

  async getHistoricalOdds(eventId: string): Promise<HistoricalOdds[]> {
    return this.historicalOdds.get(eventId) || [];
  }

  // Task 12: Bet tracking
  async saveBet(data: InsertBet): Promise<Bet> {
    const id = `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const bet: Bet = { ...data, id };
    this.bets.set(id, bet);
    return bet;
  }

  async getBets(): Promise<Bet[]> {
    return Array.from(this.bets.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getBet(id: string): Promise<Bet | null> {
    return this.bets.get(id) || null;
  }

  async updateBet(id: string, updates: Partial<Bet>): Promise<Bet> {
    const existing = this.bets.get(id);
    if (!existing) throw new Error(`Bet ${id} not found`);
    
    const updated = { ...existing, ...updates };
    this.bets.set(id, updated);
    return updated;
  }

  async deleteBet(id: string): Promise<void> {
    this.bets.delete(id);
  }

  // Task 14: Promo tracking
  async savePromo(data: InsertPromo): Promise<Promo> {
    const id = `promo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const promo: Promo = { ...data, id, timestamp };
    this.promos.set(id, promo);
    return promo;
  }

  async getPromos(): Promise<Promo[]> {
    return Array.from(this.promos.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getPromo(id: string): Promise<Promo | null> {
    return this.promos.get(id) || null;
  }

  async updatePromo(id: string, updates: Partial<Promo>): Promise<Promo> {
    const existing = this.promos.get(id);
    if (!existing) throw new Error(`Promo ${id} not found`);
    
    const updated = { ...existing, ...updates };
    this.promos.set(id, updated);
    return updated;
  }

  async deletePromo(id: string): Promise<void> {
    this.promos.delete(id);
  }
}

export const storage = new MemStorage();
