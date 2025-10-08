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
 * Calculate fair market price (true odds) for an outcome by aggregating all bookmaker odds
 * Uses the average of implied probabilities across all bookmakers
 * 
 * @param oddsArray - Array of odds from different bookmakers for the same outcome
 * @param minBookmakers - Minimum number of bookmakers required (default: 3)
 * @returns Fair probability as a percentage, or null if insufficient data
 */
export function calculateFairMarketPrice(
  oddsArray: number[],
  minBookmakers: number = 3
): number | null {
  if (oddsArray.length < minBookmakers) {
    return null;
  }

  // Calculate implied probability for each bookmaker's odds
  const impliedProbabilities = oddsArray.map(odds => calculateImpliedProbability(odds));
  
  // Average the implied probabilities to get fair probability
  const fairProbability = impliedProbabilities.reduce((sum, prob) => sum + prob, 0) / impliedProbabilities.length;
  
  return Math.round(fairProbability * 100) / 100;
}

/**
 * Calculate Expected Value (EV) for a bet
 * 
 * Formula: EV% = ((fairProb - impliedProb) / impliedProb) * 100
 * Or equivalently: EV% = (odds * fairProb - 1) * 100
 * 
 * When odds are BETTER than fair (higher odds = lower implied prob), EV is POSITIVE
 * When odds are WORSE than fair (lower odds = higher implied prob), EV is NEGATIVE
 * 
 * @param bookmakerOdds - The odds offered by a specific bookmaker
 * @param fairProbability - The fair market probability (as percentage)
 * @param stake - The stake amount for calculating EV in dollars
 * @returns Object with EV percentage and EV in dollars
 */
export function calculateExpectedValue(
  bookmakerOdds: number,
  fairProbability: number,
  stake: number = 100
): { evPercentage: number; evDollars: number } {
  // Convert fair probability from percentage to decimal
  const fairProb = fairProbability / 100;
  
  // Calculate implied probability from bookmaker odds
  const impliedProb = 1 / bookmakerOdds;
  
  // Calculate EV percentage using the correct formula
  // EV% = ((fairProb - impliedProb) / impliedProb) * 100
  // Which is equivalent to: (odds * fairProb - 1) * 100
  const evPercentage = ((fairProb - impliedProb) / impliedProb) * 100;
  
  // Calculate EV in dollars
  const evDollars = stake * (evPercentage / 100);
  
  return {
    evPercentage: Math.round(evPercentage * 100) / 100,
    evDollars: Math.round(evDollars * 100) / 100,
  };
}

/**
 * Get all odds for a specific outcome across all bookmakers
 */
function getAllOddsForOutcome(
  event: OddsApiEvent,
  outcome: string,
  marketKey: string
): number[] {
  const odds: number[] = [];
  
  for (const bookmaker of event.bookmakers) {
    const market = bookmaker.markets.find(m => m.key === marketKey);
    if (!market) continue;
    
    const outcomeData = market.outcomes.find(o => o.name === outcome);
    if (outcomeData) {
      odds.push(outcomeData.price);
    }
  }
  
  return odds;
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

  // Calculate fair market prices for each outcome
  const fairPrices = outcomes.map(outcome => {
    const allOdds = getAllOddsForOutcome(event, outcome, marketKey);
    return calculateFairMarketPrice(allOdds);
  });

  // Build arbitrage opportunity with EV calculations
  const opportunity: ArbitrageOpportunity = {
    id: `${event.id}-${marketKey}-${Date.now()}`,
    sport: event.sport_title,
    match: `${event.home_team} vs ${event.away_team}`,
    bookmakers: bestOddsPerOutcome.map((bet, idx) => {
      const fairPrice = fairPrices[idx];
      let ev: number | undefined;
      let evDollars: number | undefined;

      // Calculate EV if we have a fair price (requires minimum 3 bookmakers)
      if (fairPrice !== null) {
        const evCalc = calculateExpectedValue(bet.odds, fairPrice, arbitrageCalc.stakes[idx]);
        ev = evCalc.evPercentage;
        evDollars = evCalc.evDollars;
      }

      return {
        name: bet.bookmaker,
        outcome: bet.outcome,
        odds: bet.odds,
        stake: arbitrageCalc.stakes[idx],
        ev,
        evDollars,
      };
    }),
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
 * Find positive Expected Value (+EV) opportunities from multiple events
 * Returns bets where the bookmaker odds offer better value than the fair market price
 * 
 * @param events - Array of events to analyze
 * @param minEVPercentage - Minimum EV percentage to filter (default: 0)
 * @returns Array of arbitrage opportunities with positive EV bets
 */
export function findPositiveEVOpportunities(
  events: OddsApiEvent[],
  minEVPercentage: number = 0
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  for (const event of events) {
    const marketKey = "h2h";
    const market = event.bookmakers[0]?.markets.find(m => m.key === marketKey);
    if (!market) continue;

    const outcomes = market.outcomes.map(o => o.name);

    // Calculate fair prices for each outcome
    const fairPrices = outcomes.map(outcome => {
      const allOdds = getAllOddsForOutcome(event, outcome, marketKey);
      return calculateFairMarketPrice(allOdds);
    });

    // Check if we have fair prices for all outcomes (need minimum 3 bookmakers)
    if (fairPrices.some(fp => fp === null)) continue;

    // Find all bets with positive EV for this event
    const positiveBets: Array<{
      bookmaker: string;
      outcome: string;
      odds: number;
      ev: number;
      evDollars: number;
    }> = [];

    outcomes.forEach((outcome, outcomeIdx) => {
      const fairPrice = fairPrices[outcomeIdx];
      if (fairPrice === null) return;

      // Check each bookmaker's odds for this outcome
      for (const bookmaker of event.bookmakers) {
        const market = bookmaker.markets.find(m => m.key === marketKey);
        if (!market) continue;

        const outcomeData = market.outcomes.find(o => o.name === outcome);
        if (!outcomeData) continue;

        // Calculate EV for this bet
        const defaultStake = 100; // Use a default stake for EV calculation
        const evCalc = calculateExpectedValue(outcomeData.price, fairPrice, defaultStake);

        // If EV is positive and meets minimum threshold, add it
        if (evCalc.evPercentage >= minEVPercentage) {
          positiveBets.push({
            bookmaker: bookmaker.title,
            outcome: outcome,
            odds: outcomeData.price,
            ev: evCalc.evPercentage,
            evDollars: evCalc.evDollars,
          });
        }
      }
    });

    // Create opportunities from positive EV bets
    if (positiveBets.length > 0) {
      // Sort bets by EV percentage (highest first) and take the best ones
      positiveBets.sort((a, b) => b.ev - a.ev);

      const opportunity: ArbitrageOpportunity = {
        id: `${event.id}-${marketKey}-ev-${Date.now()}`,
        sport: event.sport_title,
        match: `${event.home_team} vs ${event.away_team}`,
        bookmakers: positiveBets.map(bet => ({
          name: bet.bookmaker,
          outcome: bet.outcome,
          odds: bet.odds,
          stake: 100, // Default stake
          ev: bet.ev,
          evDollars: bet.evDollars,
        })),
        profit: 0, // +EV bets don't have guaranteed profit like arbitrage
        timestamp: new Date().toISOString(),
        eventId: event.id,
        commenceTime: event.commence_time,
      };

      opportunities.push(opportunity);
    }
  }

  // Sort by highest EV percentage
  return opportunities.sort((a, b) => {
    const maxEVA = Math.max(...a.bookmakers.map(bm => bm.ev || 0));
    const maxEVB = Math.max(...b.bookmakers.map(bm => bm.ev || 0));
    return maxEVB - maxEVA;
  });
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

/**
 * Task 6: Calculate Market Hold Percentage
 * Hold % = (sum of all implied probabilities - 100)
 * Lower hold = better market (more efficient)
 * 
 * @param odds - Array of odds for all outcomes in a market
 * @returns Hold percentage
 */
export function calculateMarketHold(odds: number[]): number {
  const impliedProbabilities = odds.map(o => calculateImpliedProbability(o));
  const totalImpliedProb = impliedProbabilities.reduce((sum, prob) => sum + prob, 0);
  const hold = totalImpliedProb - 100;
  return Math.round(hold * 100) / 100;
}

/**
 * Task 5: Find Middle Opportunities
 * A middle exists when there's a gap between lines where both bets can win
 * For spreads: +7.5 at one book, -6.5 at another (win if result is exactly 7)
 * For totals: Over 45.5 at one book, Under 47.5 at another (win if total is 46 or 47)
 * 
 * @param events - Array of events to analyze
 * @returns Array of middle opportunities
 */
export function findMiddles(events: OddsApiEvent[]): ArbitrageOpportunity[] {
  const middles: ArbitrageOpportunity[] = [];

  for (const event of events) {
    // Check spreads market for middles
    const spreadsMarket = event.bookmakers[0]?.markets.find(m => m.key === 'spreads');
    if (spreadsMarket && spreadsMarket.outcomes.length >= 2) {
      const outcome1 = spreadsMarket.outcomes[0].name;
      const outcome2 = spreadsMarket.outcomes[1].name;

      // Find best spread lines for each team
      let bestSpread1 = { bookmaker: '', odds: 0, line: 0 };
      let bestSpread2 = { bookmaker: '', odds: 0, line: 0 };

      for (const bookmaker of event.bookmakers) {
        const market = bookmaker.markets.find(m => m.key === 'spreads');
        if (!market) continue;

        const out1 = market.outcomes.find(o => o.name === outcome1);
        const out2 = market.outcomes.find(o => o.name === outcome2);

        if (out1 && out1.price > bestSpread1.odds) {
          bestSpread1 = { 
            bookmaker: bookmaker.title, 
            odds: out1.price,
            line: parseFloat((out1 as any).point || '0')
          };
        }
        if (out2 && out2.price > bestSpread2.odds) {
          bestSpread2 = { 
            bookmaker: bookmaker.title, 
            odds: out2.price,
            line: parseFloat((out2 as any).point || '0')
          };
        }
      }

      // Check if there's a middle opportunity (gap between lines)
      if (bestSpread1.line > 0 && bestSpread2.line < 0 && 
          Math.abs(bestSpread1.line + bestSpread2.line) >= 1) {
        const gap = bestSpread1.line + bestSpread2.line;
        const arbitrageCalc = calculateArbitrage([
          { bookmaker: bestSpread1.bookmaker, outcome: outcome1, odds: bestSpread1.odds },
          { bookmaker: bestSpread2.bookmaker, outcome: outcome2, odds: bestSpread2.odds }
        ]);

        middles.push({
          id: `${event.id}-spreads-middle-${Date.now()}`,
          sport: event.sport_title,
          match: `${event.home_team} vs ${event.away_team}`,
          bookmakers: [
            {
              name: bestSpread1.bookmaker,
              outcome: `${outcome1} ${bestSpread1.line >= 0 ? '+' : ''}${bestSpread1.line}`,
              odds: bestSpread1.odds,
              stake: arbitrageCalc.stakes[0]
            },
            {
              name: bestSpread2.bookmaker,
              outcome: `${outcome2} ${bestSpread2.line >= 0 ? '+' : ''}${bestSpread2.line}`,
              odds: bestSpread2.odds,
              stake: arbitrageCalc.stakes[1]
            }
          ],
          profit: arbitrageCalc.profitPercentage,
          timestamp: new Date().toISOString(),
          eventId: event.id,
          commenceTime: event.commence_time,
          isMiddle: true,
          middleInfo: {
            isMiddle: true,
            line1: bestSpread1.line,
            line2: bestSpread2.line,
            winScenarios: [`Win both if margin is exactly ${Math.floor(Math.abs(gap))} points`]
          },
          marketType: 'spreads'
        });
      }
    }

    // Check totals market for middles
    const totalsMarket = event.bookmakers[0]?.markets.find(m => m.key === 'totals');
    if (totalsMarket && totalsMarket.outcomes.length >= 2) {
      let bestOver = { bookmaker: '', odds: 0, line: 0 };
      let bestUnder = { bookmaker: '', odds: 0, line: 0 };

      for (const bookmaker of event.bookmakers) {
        const market = bookmaker.markets.find(m => m.key === 'totals');
        if (!market) continue;

        const over = market.outcomes.find(o => o.name === 'Over');
        const under = market.outcomes.find(o => o.name === 'Under');

        if (over && over.price > bestOver.odds) {
          bestOver = { 
            bookmaker: bookmaker.title, 
            odds: over.price,
            line: parseFloat((over as any).point || '0')
          };
        }
        if (under && under.price > bestUnder.odds) {
          bestUnder = { 
            bookmaker: bookmaker.title, 
            odds: under.price,
            line: parseFloat((under as any).point || '0')
          };
        }
      }

      // Check if there's a middle (gap between over and under lines)
      if (bestOver.line > 0 && bestUnder.line > 0 && bestUnder.line - bestOver.line >= 1) {
        const gap = bestUnder.line - bestOver.line;
        const arbitrageCalc = calculateArbitrage([
          { bookmaker: bestOver.bookmaker, outcome: 'Over', odds: bestOver.odds },
          { bookmaker: bestUnder.bookmaker, outcome: 'Under', odds: bestUnder.odds }
        ]);

        const winningScores = [];
        for (let i = Math.ceil(bestOver.line); i < bestUnder.line; i++) {
          winningScores.push(i);
        }

        middles.push({
          id: `${event.id}-totals-middle-${Date.now()}`,
          sport: event.sport_title,
          match: `${event.home_team} vs ${event.away_team}`,
          bookmakers: [
            {
              name: bestOver.bookmaker,
              outcome: `Over ${bestOver.line}`,
              odds: bestOver.odds,
              stake: arbitrageCalc.stakes[0]
            },
            {
              name: bestUnder.bookmaker,
              outcome: `Under ${bestUnder.line}`,
              odds: bestUnder.odds,
              stake: arbitrageCalc.stakes[1]
            }
          ],
          profit: arbitrageCalc.profitPercentage,
          timestamp: new Date().toISOString(),
          eventId: event.id,
          commenceTime: event.commence_time,
          isMiddle: true,
          middleInfo: {
            isMiddle: true,
            line1: bestOver.line,
            line2: bestUnder.line,
            winScenarios: [`Win both if total is: ${winningScores.join(', ')}`]
          },
          marketType: 'totals'
        });
      }
    }
  }

  return middles.sort((a, b) => b.profit - a.profit);
}
