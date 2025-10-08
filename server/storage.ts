import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import ws from "ws";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;
import type { 
  ArbitrageOpportunity, 
  Settings, 
  HistoricalOdds, 
  InsertHistoricalOdds,
  Bet,
  InsertBet,
  Promo,
  InsertPromo,
  Event,
  InsertEvent
} from "@shared/schema";
import {
  settingsTable,
  historicalOddsTable,
  betsTable,
  promosTable,
  eventsTable,
} from "@shared/schema";

// ============================================================================
// POSTGRESQL STORAGE INTERFACE
// ============================================================================

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
  
  // Event storage for API data persistence
  saveEvent(event: InsertEvent): Promise<Event>;
  getEvents(options?: { thisWeekOnly?: boolean }): Promise<Event[]>;
  getEvent(eventId: string): Promise<Event | null>;
  updateEvent(eventId: string, updates: Partial<Event>): Promise<Event>;
  deleteEvent(eventId: string): Promise<void>;
  cleanupOldEvents(): Promise<number>; // Returns count of deleted events
}

// PostgreSQL Storage Implementation
export class PostgresStorage implements IStorage {
  private db;
  private cachedOpportunities: ArbitrageOpportunity[] = [];

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
  }

  // Settings management
  async getSettings(): Promise<Settings> {
    const result = await this.db.select().from(settingsTable).limit(1);
    
    if (result.length === 0) {
      // Create default settings
      const defaultSettings = {
        mockMode: process.env.MOCK_ODDS === "true",
        cacheTimeout: 60,
        autoRefreshInterval: 30,
        showMockData: true,
        showLiveData: true,
        minEV: "1",
        bookmakerPreferences: [],
        notificationPreferences: {
          enabled: false,
          minProfit: 2,
          sound: true,
        },
      };
      
      const [inserted] = await this.db.insert(settingsTable).values(defaultSettings).returning();
      return this.mapSettingsFromDb(inserted);
    }
    
    return this.mapSettingsFromDb(result[0]);
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const currentRow = await this.db.select().from(settingsTable).limit(1);
    
    if (currentRow.length === 0) {
      throw new Error("Settings not found");
    }

    const dbUpdates: any = {};
    if (updates.apiKey !== undefined) dbUpdates.apiKey = updates.apiKey;
    if (updates.mockMode !== undefined) dbUpdates.mockMode = updates.mockMode;
    if (updates.cacheTimeout !== undefined) dbUpdates.cacheTimeout = updates.cacheTimeout;
    if (updates.autoRefreshInterval !== undefined) dbUpdates.autoRefreshInterval = updates.autoRefreshInterval;
    if (updates.showMockData !== undefined) dbUpdates.showMockData = updates.showMockData;
    if (updates.showLiveData !== undefined) dbUpdates.showLiveData = updates.showLiveData;
    if (updates.sports !== undefined) dbUpdates.sports = updates.sports;
    if (updates.bookmakerPreferences !== undefined) dbUpdates.bookmakerPreferences = updates.bookmakerPreferences;
    if (updates.minEV !== undefined) dbUpdates.minEV = updates.minEV.toString();
    if (updates.notificationPreferences !== undefined) dbUpdates.notificationPreferences = updates.notificationPreferences;
    dbUpdates.updatedAt = new Date();

    const [updated] = await this.db
      .update(settingsTable)
      .set(dbUpdates)
      .where(eq(settingsTable.id, currentRow[0].id))
      .returning();

    return this.mapSettingsFromDb(updated);
  }

  private mapSettingsFromDb(row: any): Settings {
    return {
      apiKey: row.apiKey || undefined,
      mockMode: row.mockMode || false,
      cacheTimeout: row.cacheTimeout || 60,
      autoRefreshInterval: row.autoRefreshInterval || 30,
      showMockData: row.showMockData ?? true,
      showLiveData: row.showLiveData ?? true,
      sports: row.sports || undefined,
      bookmakerPreferences: row.bookmakerPreferences || undefined,
      minEV: parseFloat(row.minEV || "1"),
      notificationPreferences: row.notificationPreferences || {
        enabled: false,
        minProfit: 2,
        sound: true,
      },
    };
  }

  // Opportunities cache (in-memory for now since opportunities are real-time)
  async getCachedOpportunities(): Promise<ArbitrageOpportunity[]> {
    return [...this.cachedOpportunities];
  }

  async setCachedOpportunities(opportunities: ArbitrageOpportunity[]): Promise<void> {
    this.cachedOpportunities = opportunities;
  }

  // Historical odds
  async saveHistoricalOdds(data: InsertHistoricalOdds): Promise<HistoricalOdds> {
    const [inserted] = await this.db
      .insert(historicalOddsTable)
      .values({
        eventId: data.eventId,
        bookmaker: data.bookmaker,
        outcome: data.outcome,
        odds: data.odds.toString(),
        marketType: data.marketType,
      })
      .returning();

    return {
      id: inserted.id.toString(),
      eventId: inserted.eventId,
      bookmaker: inserted.bookmaker,
      outcome: inserted.outcome,
      odds: parseFloat(inserted.odds),
      timestamp: inserted.timestamp.toISOString(),
      marketType: inserted.marketType as any,
    };
  }

  async getHistoricalOdds(eventId: string): Promise<HistoricalOdds[]> {
    const results = await this.db
      .select()
      .from(historicalOddsTable)
      .where(eq(historicalOddsTable.eventId, eventId));

    return results.map(row => ({
      id: row.id.toString(),
      eventId: row.eventId,
      bookmaker: row.bookmaker,
      outcome: row.outcome,
      odds: parseFloat(row.odds),
      timestamp: row.timestamp.toISOString(),
      marketType: row.marketType as any,
    }));
  }

  // Bet tracking
  async saveBet(data: InsertBet): Promise<Bet> {
    const [inserted] = await this.db
      .insert(betsTable)
      .values({
        eventId: data.eventId,
        sport: data.sport,
        match: data.match,
        bookmakers: data.bookmakers,
        status: data.status,
        profit: data.profit.toString(),
        closingOdds: data.closingOdds,
        clv: data.clv?.toString(),
      })
      .returning();

    return {
      id: inserted.id.toString(),
      eventId: inserted.eventId,
      sport: inserted.sport,
      match: inserted.match,
      bookmakers: inserted.bookmakers as any,
      status: inserted.status as any,
      profit: parseFloat(inserted.profit),
      timestamp: inserted.timestamp.toISOString(),
      closingOdds: inserted.closingOdds as any,
      clv: inserted.clv ? parseFloat(inserted.clv) : undefined,
    };
  }

  async getBets(): Promise<Bet[]> {
    const results = await this.db.select().from(betsTable);
    
    return results.map(row => ({
      id: row.id.toString(),
      eventId: row.eventId,
      sport: row.sport,
      match: row.match,
      bookmakers: row.bookmakers as any,
      status: row.status as any,
      profit: parseFloat(row.profit),
      timestamp: row.timestamp.toISOString(),
      closingOdds: row.closingOdds as any,
      clv: row.clv ? parseFloat(row.clv) : undefined,
    }));
  }

  async getBet(id: string): Promise<Bet | null> {
    const [result] = await this.db
      .select()
      .from(betsTable)
      .where(eq(betsTable.id, parseInt(id)));

    if (!result) return null;

    return {
      id: result.id.toString(),
      eventId: result.eventId,
      sport: result.sport,
      match: result.match,
      bookmakers: result.bookmakers as any,
      status: result.status as any,
      profit: parseFloat(result.profit),
      timestamp: result.timestamp.toISOString(),
      closingOdds: result.closingOdds as any,
      clv: result.clv ? parseFloat(result.clv) : undefined,
    };
  }

  async updateBet(id: string, updates: Partial<Bet>): Promise<Bet> {
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.profit !== undefined) dbUpdates.profit = updates.profit.toString();
    if (updates.closingOdds !== undefined) dbUpdates.closingOdds = updates.closingOdds;
    if (updates.clv !== undefined) dbUpdates.clv = updates.clv.toString();

    const [updated] = await this.db
      .update(betsTable)
      .set(dbUpdates)
      .where(eq(betsTable.id, parseInt(id)))
      .returning();

    return {
      id: updated.id.toString(),
      eventId: updated.eventId,
      sport: updated.sport,
      match: updated.match,
      bookmakers: updated.bookmakers as any,
      status: updated.status as any,
      profit: parseFloat(updated.profit),
      timestamp: updated.timestamp.toISOString(),
      closingOdds: updated.closingOdds as any,
      clv: updated.clv ? parseFloat(updated.clv) : undefined,
    };
  }

  async deleteBet(id: string): Promise<void> {
    await this.db.delete(betsTable).where(eq(betsTable.id, parseInt(id)));
  }

  // Promo tracking
  async savePromo(data: InsertPromo): Promise<Promo> {
    const [inserted] = await this.db
      .insert(promosTable)
      .values({
        bookmaker: data.bookmaker,
        type: data.type,
        value: data.value.toString(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        notes: data.notes,
      })
      .returning();

    return {
      id: inserted.id.toString(),
      bookmaker: inserted.bookmaker,
      type: inserted.type as any,
      value: parseFloat(inserted.value),
      expiryDate: inserted.expiryDate?.toISOString(),
      notes: inserted.notes || undefined,
      timestamp: inserted.timestamp.toISOString(),
    };
  }

  async getPromos(): Promise<Promo[]> {
    const results = await this.db.select().from(promosTable);
    
    return results.map(row => ({
      id: row.id.toString(),
      bookmaker: row.bookmaker,
      type: row.type as any,
      value: parseFloat(row.value),
      expiryDate: row.expiryDate?.toISOString(),
      notes: row.notes || undefined,
      timestamp: row.timestamp.toISOString(),
    }));
  }

  async getPromo(id: string): Promise<Promo | null> {
    const [result] = await this.db
      .select()
      .from(promosTable)
      .where(eq(promosTable.id, parseInt(id)));

    if (!result) return null;

    return {
      id: result.id.toString(),
      bookmaker: result.bookmaker,
      type: result.type as any,
      value: parseFloat(result.value),
      expiryDate: result.expiryDate?.toISOString(),
      notes: result.notes || undefined,
      timestamp: result.timestamp.toISOString(),
    };
  }

  async updatePromo(id: string, updates: Partial<Promo>): Promise<Promo> {
    const dbUpdates: any = {};
    if (updates.bookmaker !== undefined) dbUpdates.bookmaker = updates.bookmaker;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.value !== undefined) dbUpdates.value = updates.value.toString();
    if (updates.expiryDate !== undefined) dbUpdates.expiryDate = new Date(updates.expiryDate);
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const [updated] = await this.db
      .update(promosTable)
      .set(dbUpdates)
      .where(eq(promosTable.id, parseInt(id)))
      .returning();

    return {
      id: updated.id.toString(),
      bookmaker: updated.bookmaker,
      type: updated.type as any,
      value: parseFloat(updated.value),
      expiryDate: updated.expiryDate?.toISOString(),
      notes: updated.notes || undefined,
      timestamp: updated.timestamp.toISOString(),
    };
  }

  async deletePromo(id: string): Promise<void> {
    await this.db.delete(promosTable).where(eq(promosTable.id, parseInt(id)));
  }

  // Event storage implementation
  async saveEvent(data: InsertEvent): Promise<Event> {
    // Check if event already exists
    const existing = await this.getEvent(data.eventId);
    
    if (existing) {
      // Update existing event
      return this.updateEvent(data.eventId, data);
    }

    const [inserted] = await this.db
      .insert(eventsTable)
      .values({
        eventId: data.eventId,
        sportKey: data.sportKey,
        sportTitle: data.sportTitle,
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        commenceTime: new Date(data.commenceTime),
        bookmakers: data.bookmakers,
      })
      .returning();

    return {
      id: inserted.id.toString(),
      eventId: inserted.eventId,
      sportKey: inserted.sportKey,
      sportTitle: inserted.sportTitle,
      homeTeam: inserted.homeTeam,
      awayTeam: inserted.awayTeam,
      commenceTime: inserted.commenceTime.toISOString(),
      bookmakers: inserted.bookmakers as any,
      createdAt: inserted.createdAt.toISOString(),
      lastUpdated: inserted.lastUpdated.toISOString(),
    };
  }

  async getEvents(options?: { thisWeekOnly?: boolean }): Promise<Event[]> {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let query = this.db.select().from(eventsTable);

    if (options?.thisWeekOnly) {
      // Only get events in the next week that haven't started yet
      const { and, gte, lte } = await import("drizzle-orm");
      query = query.where(
        and(
          gte(eventsTable.commenceTime, now),
          lte(eventsTable.commenceTime, oneWeekFromNow)
        )
      ) as any;
    }

    const results = await query;

    return results.map(row => ({
      id: row.id.toString(),
      eventId: row.eventId,
      sportKey: row.sportKey,
      sportTitle: row.sportTitle,
      homeTeam: row.homeTeam,
      awayTeam: row.awayTeam,
      commenceTime: row.commenceTime.toISOString(),
      bookmakers: row.bookmakers as any,
      createdAt: row.createdAt.toISOString(),
      lastUpdated: row.lastUpdated.toISOString(),
    }));
  }

  async getEvent(eventId: string): Promise<Event | null> {
    const [result] = await this.db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.eventId, eventId));

    if (!result) return null;

    return {
      id: result.id.toString(),
      eventId: result.eventId,
      sportKey: result.sportKey,
      sportTitle: result.sportTitle,
      homeTeam: result.homeTeam,
      awayTeam: result.awayTeam,
      commenceTime: result.commenceTime.toISOString(),
      bookmakers: result.bookmakers as any,
      createdAt: result.createdAt.toISOString(),
      lastUpdated: result.lastUpdated.toISOString(),
    };
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    const dbUpdates: any = { lastUpdated: new Date() };
    
    if (updates.sportKey !== undefined) dbUpdates.sportKey = updates.sportKey;
    if (updates.sportTitle !== undefined) dbUpdates.sportTitle = updates.sportTitle;
    if (updates.homeTeam !== undefined) dbUpdates.homeTeam = updates.homeTeam;
    if (updates.awayTeam !== undefined) dbUpdates.awayTeam = updates.awayTeam;
    if (updates.commenceTime !== undefined) dbUpdates.commenceTime = new Date(updates.commenceTime);
    if (updates.bookmakers !== undefined) dbUpdates.bookmakers = updates.bookmakers;

    const [updated] = await this.db
      .update(eventsTable)
      .set(dbUpdates)
      .where(eq(eventsTable.eventId, eventId))
      .returning();

    return {
      id: updated.id.toString(),
      eventId: updated.eventId,
      sportKey: updated.sportKey,
      sportTitle: updated.sportTitle,
      homeTeam: updated.homeTeam,
      awayTeam: updated.awayTeam,
      commenceTime: updated.commenceTime.toISOString(),
      bookmakers: updated.bookmakers as any,
      createdAt: updated.createdAt.toISOString(),
      lastUpdated: updated.lastUpdated.toISOString(),
    };
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.db.delete(eventsTable).where(eq(eventsTable.eventId, eventId));
  }

  async cleanupOldEvents(): Promise<number> {
    const now = new Date();
    const { lt } = await import("drizzle-orm");
    
    const result = await this.db
      .delete(eventsTable)
      .where(lt(eventsTable.commenceTime, now))
      .returning();

    console.log(`[Cleanup] Deleted ${result.length} old events`);
    return result.length;
  }
}

export const storage = new PostgresStorage();
