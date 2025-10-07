import type { ArbitrageOpportunity, OddsApiEvent } from "@shared/schema";

// ============================================================================
// ADVANCED ARBITRAGE CALCULATION ENGINE
// ============================================================================

interface ArbitrageCalculation {
  hasArbitrage: boolean;
  profitPercentage: number;
  stakes: number[];
  impliedProbabilities: number[];
  totalImpliedProbability: number;
}

interface BookmakerBet {
  bookmaker: string;
  outcome: string;
  odds: number;
}

/**
 * Calculate implied probability from decimal odds
 * Formula: 1 / odds * 100
 */
export function calculateImpliedProbability(odds: number): number {
  return (1 / odds) * 100;
}

/**
 * Calculate arbitrage for any number of outcomes (2-way or 3-way markets)
 * 
 * @param bets - Array of bookmaker bets with odds
 * @param totalStake - Total amount to invest (default: 1000)
 * @returns Arbitrage calculation result
 */
export function calculateArbitrage(
  bets: BookmakerBet[],
  totalStake: number = 1000
): ArbitrageCalculation {
  // Calculate implied probabilities
  const impliedProbabilities = bets.map(bet => calculateImpliedProbability(bet.odds));
  
  // Calculate total implied probability (arbitrage exists if < 100%)
  const totalImpliedProbability = impliedProbabilities.reduce((sum, prob) => sum + prob, 0);
  
  const hasArbitrage = totalImpliedProbability < 100;
  
  // Calculate profit percentage
  // Formula: (1 / total_implied_probability - 1) * 100
  const profitPercentage = hasArbitrage 
    ? ((1 / (totalImpliedProbability / 100)) - 1) * 100
    : 0;
  
  // Calculate optimal stakes for equal profit across all outcomes
  // Formula: stake_i = (total_stake * implied_prob_i) / total_implied_prob
  const stakes = impliedProbabilities.map(prob => 
    (totalStake * (prob / 100)) / (totalImpliedProbability / 100)
  );
  
  return {
    hasArbitrage,
    profitPercentage: Math.round(profitPercentage * 100) / 100,
    stakes: stakes.map(s => Math.round(s * 100) / 100),
    impliedProbabilities: impliedProbabilities.map(p => Math.round(p * 100) / 100),
    totalImpliedProbability: Math.round(totalImpliedProbability * 100) / 100,
  };
}

/**
 * Kelly Criterion for optimal stake sizing
 * Formula: f* = (bp - q) / b
 * where:
 *   f* = fraction of bankroll to bet
 *   b = odds - 1 (net odds)
 *   p = probability of winning
 *   q = probability of losing (1 - p)
 * 
 * For arbitrage, we use a conservative fractional Kelly (e.g., 0.25 or 0.5)
 */
export function calculateKellyStake(
  odds: number,
  trueProbability: number,
  bankroll: number,
  kellyFraction: number = 0.5
): number {
  const b = odds - 1;
  const p = trueProbability / 100;
  const q = 1 - p;
  
  const kellyPercentage = (b * p - q) / b;
  const conservativeKelly = Math.max(0, kellyPercentage * kellyFraction);
  
  return Math.round(bankroll * conservativeKelly * 100) / 100;
}

/**
 * Find best arbitrage opportunities from odds data for a single event
 */
export function findBestArbitrage(
  event: OddsApiEvent,
  marketKey: string = "h2h"
): ArbitrageOpportunity | null {
  const market = event.bookmakers[0]?.markets.find(m => m.key === marketKey);
  if (!market) return null;

  const outcomes = market.outcomes.map(o => o.name);
  
  // Find best odds for each outcome across all bookmakers
  const bestOddsPerOutcome = outcomes.map(outcome => {
    let bestOdds = 0;
    let bestBookmaker = "";
    
    for (const bookmaker of event.bookmakers) {
      const market = bookmaker.markets.find(m => m.key === marketKey);
      if (!market) continue;
      
      const outcomeData = market.outcomes.find(o => o.name === outcome);
      if (outcomeData && outcomeData.price > bestOdds) {
        bestOdds = outcomeData.price;
        bestBookmaker = bookmaker.title;
      }
    }
    
    return {
      bookmaker: bestBookmaker,
      outcome,
      odds: bestOdds,
    };
  }).filter(bet => bet.odds > 0);

  if (bestOddsPerOutcome.length < 2) return null;

  // Calculate arbitrage
  const arbitrageCalc = calculateArbitrage(bestOddsPerOutcome);
  
  if (!arbitrageCalc.hasArbitrage) return null;

  // Build arbitrage opportunity
  const opportunity: ArbitrageOpportunity = {
    id: `${event.id}-${marketKey}-${Date.now()}`,
    sport: event.sport_title,
    match: `${event.home_team} vs ${event.away_team}`,
    bookmakers: bestOddsPerOutcome.map((bet, idx) => ({
      name: bet.bookmaker,
      outcome: bet.outcome,
      odds: bet.odds,
      stake: arbitrageCalc.stakes[idx],
    })),
    profit: arbitrageCalc.profitPercentage,
    timestamp: new Date().toISOString(),
    eventId: event.id,
    commenceTime: event.commence_time,
  };

  return opportunity;
}

/**
 * Find all arbitrage opportunities from multiple events
 */
export function findAllArbitrageOpportunities(
  events: OddsApiEvent[],
  minProfitPercentage: number = 0
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  for (const event of events) {
    // Check h2h (head-to-head) market
    const h2hArbitrage = findBestArbitrage(event, "h2h");
    if (h2hArbitrage && h2hArbitrage.profit >= minProfitPercentage) {
      opportunities.push(h2hArbitrage);
    }
  }

  // Sort by profit percentage (highest first)
  return opportunities.sort((a, b) => b.profit - a.profit);
}

/**
 * Validate arbitrage calculation (for testing)
 * Ensures that all outcomes yield the same profit
 */
export function validateArbitrage(opportunity: ArbitrageOpportunity): boolean {
  const totalStake = opportunity.bookmakers.reduce((sum, b) => sum + b.stake, 0);
  
  const profits = opportunity.bookmakers.map(b => {
    const payout = b.stake * b.odds;
    return payout - totalStake;
  });
  
  // All profits should be approximately equal (within 0.01% tolerance)
  const firstProfit = profits[0];
  return profits.every(p => Math.abs(p - firstProfit) < 0.01);
}
