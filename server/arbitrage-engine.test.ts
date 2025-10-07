import { describe, it, expect } from '@jest/globals';
import {
  calculateImpliedProbability,
  calculateArbitrage,
  calculateKellyStake,
  calculateFairMarketPrice,
  calculateExpectedValue,
  findBestArbitrage,
  findAllArbitrageOpportunities,
  findPositiveEVOpportunities,
  validateArbitrage,
} from './arbitrage-engine';
import type { OddsApiEvent } from '@shared/schema';

// ============================================================================
// ARBITRAGE ENGINE TESTS
// ============================================================================

describe('Arbitrage Engine', () => {
  
  describe('calculateImpliedProbability', () => {
    it('should calculate correct implied probability from decimal odds', () => {
      expect(calculateImpliedProbability(2.0)).toBe(50);
      expect(calculateImpliedProbability(4.0)).toBe(25);
      expect(calculateImpliedProbability(1.5)).toBeCloseTo(66.67, 1);
    });

    it('should handle very high odds correctly', () => {
      expect(calculateImpliedProbability(10.0)).toBe(10);
      expect(calculateImpliedProbability(100.0)).toBe(1);
    });
  });

  describe('calculateArbitrage', () => {
    it('should detect arbitrage in a 2-way market', () => {
      const bets = [
        { bookmaker: 'Bet365', outcome: 'Team A', odds: 2.10 },
        { bookmaker: 'DraftKings', outcome: 'Team B', odds: 2.10 },
      ];

      const result = calculateArbitrage(bets, 1000);
      
      expect(result.hasArbitrage).toBe(true);
      expect(result.profitPercentage).toBeGreaterThan(0);
      expect(result.totalImpliedProbability).toBeLessThan(100);
      expect(result.stakes).toHaveLength(2);
      expect(result.stakes.reduce((a, b) => a + b, 0)).toBeCloseTo(1000, 1);
    });

    it('should detect no arbitrage when total implied probability >= 100%', () => {
      const bets = [
        { bookmaker: 'Bet365', outcome: 'Team A', odds: 1.90 },
        { bookmaker: 'DraftKings', outcome: 'Team B', odds: 1.90 },
      ];

      const result = calculateArbitrage(bets, 1000);
      
      expect(result.hasArbitrage).toBe(false);
      expect(result.profitPercentage).toBe(0);
      expect(result.totalImpliedProbability).toBeGreaterThanOrEqual(100);
    });

    it('should handle 3-way markets correctly', () => {
      const bets = [
        { bookmaker: 'Bet365', outcome: 'Home', odds: 2.50 },
        { bookmaker: 'DraftKings', outcome: 'Away', odds: 3.20 },
        { bookmaker: 'FanDuel', outcome: 'Draw', odds: 3.80 },
      ];

      const result = calculateArbitrage(bets, 1000);
      
      expect(result.hasArbitrage).toBe(true);
      expect(result.profitPercentage).toBeGreaterThan(0);
      expect(result.stakes).toHaveLength(3);
      expect(result.stakes.reduce((a, b) => a + b, 0)).toBeCloseTo(1000, 1);
    });

    it('should calculate equal profit across all outcomes', () => {
      const bets = [
        { bookmaker: 'Bet365', outcome: 'Team A', odds: 2.10 },
        { bookmaker: 'DraftKings', outcome: 'Team B', odds: 2.10 },
      ];

      const result = calculateArbitrage(bets, 1000);
      const totalStake = result.stakes.reduce((a, b) => a + b, 0);
      
      // Calculate profit for each outcome
      const profits = result.stakes.map((stake, i) => {
        const payout = stake * bets[i].odds;
        return payout - totalStake;
      });
      
      // All profits should be approximately equal
      profits.forEach(profit => {
        expect(profit).toBeCloseTo(profits[0], 1);
      });
    });
  });

  describe('calculateKellyStake', () => {
    it('should calculate Kelly stake correctly', () => {
      const odds = 2.0;
      const trueProbability = 60;
      const bankroll = 1000;
      const kellyFraction = 0.5;

      const stake = calculateKellyStake(odds, trueProbability, bankroll, kellyFraction);
      
      expect(stake).toBeGreaterThan(0);
      expect(stake).toBeLessThanOrEqual(bankroll);
    });

    it('should return 0 for negative edge', () => {
      const odds = 1.5;
      const trueProbability = 50;
      const bankroll = 1000;

      const stake = calculateKellyStake(odds, trueProbability, bankroll);
      
      expect(stake).toBe(0);
    });

    it('should apply fractional Kelly correctly', () => {
      const odds = 2.0;
      const trueProbability = 60;
      const bankroll = 1000;

      const fullKelly = calculateKellyStake(odds, trueProbability, bankroll, 1.0);
      const halfKelly = calculateKellyStake(odds, trueProbability, bankroll, 0.5);
      
      expect(halfKelly).toBeCloseTo(fullKelly / 2, 1);
    });
  });

  describe('findBestArbitrage', () => {
    it('should find arbitrage opportunity in event data', () => {
      const event: OddsApiEvent = {
        id: 'test_event_1',
        sport_key: 'basketball_nba',
        sport_title: 'Basketball - NBA',
        commence_time: new Date().toISOString(),
        home_team: 'Lakers',
        away_team: 'Warriors',
        bookmakers: [
          {
            key: 'bet365',
            title: 'Bet365',
            last_update: new Date().toISOString(),
            markets: [{
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Lakers', price: 2.10 },
                { name: 'Warriors', price: 2.00 },
              ]
            }]
          },
          {
            key: 'draftkings',
            title: 'DraftKings',
            last_update: new Date().toISOString(),
            markets: [{
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Lakers', price: 2.05 },
                { name: 'Warriors', price: 2.10 },
              ]
            }]
          },
        ]
      };

      const opportunity = findBestArbitrage(event, 'h2h');
      
      expect(opportunity).not.toBeNull();
      expect(opportunity!.sport).toBe('Basketball - NBA');
      expect(opportunity!.match).toBe('Lakers vs Warriors');
      expect(opportunity!.bookmakers).toHaveLength(2);
      expect(opportunity!.profit).toBeGreaterThan(0);
    });

    it('should return null when no arbitrage exists', () => {
      const event: OddsApiEvent = {
        id: 'test_event_2',
        sport_key: 'basketball_nba',
        sport_title: 'Basketball - NBA',
        commence_time: new Date().toISOString(),
        home_team: 'Lakers',
        away_team: 'Warriors',
        bookmakers: [
          {
            key: 'bet365',
            title: 'Bet365',
            last_update: new Date().toISOString(),
            markets: [{
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Lakers', price: 1.90 },
                { name: 'Warriors', price: 1.90 },
              ]
            }]
          },
        ]
      };

      const opportunity = findBestArbitrage(event, 'h2h');
      
      expect(opportunity).toBeNull();
    });
  });

  describe('findAllArbitrageOpportunities', () => {
    it('should find all arbitrage opportunities and sort by profit', () => {
      const events: OddsApiEvent[] = [
        {
          id: 'event_1',
          sport_key: 'basketball_nba',
          sport_title: 'Basketball - NBA',
          commence_time: new Date().toISOString(),
          home_team: 'Lakers',
          away_team: 'Warriors',
          bookmakers: [
            {
              key: 'bet365',
              title: 'Bet365',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 2.10 },
                  { name: 'Warriors', price: 2.00 },
                ]
              }]
            },
            {
              key: 'draftkings',
              title: 'DraftKings',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 2.05 },
                  { name: 'Warriors', price: 2.10 },
                ]
              }]
            },
          ]
        },
        {
          id: 'event_2',
          sport_key: 'tennis_atp',
          sport_title: 'Tennis - ATP',
          commence_time: new Date().toISOString(),
          home_team: 'Djokovic',
          away_team: 'Nadal',
          bookmakers: [
            {
              key: 'bet365',
              title: 'Bet365',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Djokovic', price: 2.20 },
                  { name: 'Nadal', price: 1.80 },
                ]
              }]
            },
            {
              key: 'draftkings',
              title: 'DraftKings',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Djokovic', price: 2.10 },
                  { name: 'Nadal', price: 1.90 },
                ]
              }]
            },
          ]
        },
      ];

      const opportunities = findAllArbitrageOpportunities(events, 0);
      
      expect(opportunities.length).toBeGreaterThan(0);
      
      // Verify sorting by profit (descending)
      for (let i = 1; i < opportunities.length; i++) {
        expect(opportunities[i - 1].profit).toBeGreaterThanOrEqual(opportunities[i].profit);
      }
    });

    it('should filter by minimum profit percentage', () => {
      const events: OddsApiEvent[] = [
        {
          id: 'event_1',
          sport_key: 'basketball_nba',
          sport_title: 'Basketball - NBA',
          commence_time: new Date().toISOString(),
          home_team: 'Lakers',
          away_team: 'Warriors',
          bookmakers: [
            {
              key: 'bet365',
              title: 'Bet365',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 2.10 },
                  { name: 'Warriors', price: 2.00 },
                ]
              }]
            },
            {
              key: 'draftkings',
              title: 'DraftKings',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 2.05 },
                  { name: 'Warriors', price: 2.10 },
                ]
              }]
            },
          ]
        },
      ];

      const allOpportunities = findAllArbitrageOpportunities(events, 0);
      const filteredOpportunities = findAllArbitrageOpportunities(events, 5);
      
      expect(filteredOpportunities.length).toBeLessThanOrEqual(allOpportunities.length);
      filteredOpportunities.forEach(opp => {
        expect(opp.profit).toBeGreaterThanOrEqual(5);
      });
    });
  });

  describe('validateArbitrage', () => {
    it('should validate that all outcomes yield equal profit', () => {
      const bets = [
        { bookmaker: 'Bet365', outcome: 'Team A', odds: 2.10 },
        { bookmaker: 'DraftKings', outcome: 'Team B', odds: 2.10 },
      ];

      const arbitrageCalc = calculateArbitrage(bets, 1000);
      
      const opportunity = {
        id: 'test_1',
        sport: 'Test Sport',
        match: 'Team A vs Team B',
        bookmakers: bets.map((bet, i) => ({
          name: bet.bookmaker,
          outcome: bet.outcome,
          odds: bet.odds,
          stake: arbitrageCalc.stakes[i],
        })),
        profit: arbitrageCalc.profitPercentage,
        timestamp: new Date().toISOString(),
      };

      expect(validateArbitrage(opportunity)).toBe(true);
    });

    it('should invalidate incorrect stake distributions', () => {
      const opportunity = {
        id: 'test_2',
        sport: 'Test Sport',
        match: 'Team A vs Team B',
        bookmakers: [
          { name: 'Bet365', outcome: 'Team A', odds: 2.10, stake: 600 },
          { name: 'DraftKings', outcome: 'Team B', odds: 2.10, stake: 400 },
        ],
        profit: 5.0,
        timestamp: new Date().toISOString(),
      };

      expect(validateArbitrage(opportunity)).toBe(false);
    });
  });

  describe('calculateFairMarketPrice', () => {
    it('should calculate fair market price from multiple bookmaker odds', () => {
      const odds = [2.10, 2.05, 2.15, 2.08];
      const fairPrice = calculateFairMarketPrice(odds);
      
      expect(fairPrice).not.toBeNull();
      // Average of implied probabilities: (47.62 + 48.78 + 46.51 + 48.08) / 4 = 47.75
      expect(fairPrice).toBeCloseTo(47.75, 1);
    });

    it('should return null when insufficient bookmakers', () => {
      const odds = [2.10, 2.05]; // Only 2 bookmakers
      const fairPrice = calculateFairMarketPrice(odds);
      
      expect(fairPrice).toBeNull();
    });

    it('should respect minimum bookmaker requirement', () => {
      const odds = [2.10, 2.05, 2.15, 2.08];
      const fairPriceWith3 = calculateFairMarketPrice(odds, 3);
      const fairPriceWith5 = calculateFairMarketPrice(odds, 5);
      
      expect(fairPriceWith3).not.toBeNull();
      expect(fairPriceWith5).toBeNull(); // Not enough bookmakers
    });

    it('should handle identical odds correctly', () => {
      const odds = [2.00, 2.00, 2.00];
      const fairPrice = calculateFairMarketPrice(odds);
      
      expect(fairPrice).toBe(50); // All imply 50%
    });
  });

  describe('calculateExpectedValue', () => {
    it('should calculate positive EV correctly', () => {
      const bookmakerOdds = 2.20; // Implied prob: 45.45%
      const fairProbability = 50; // True prob: 50%
      const stake = 100;
      
      const ev = calculateExpectedValue(bookmakerOdds, fairProbability, stake);
      
      expect(ev.evPercentage).toBeGreaterThan(0); // Positive EV (fair 50% > implied 45.45%)
      expect(ev.evDollars).toBeGreaterThan(0);
    });

    it('should calculate negative EV correctly', () => {
      const bookmakerOdds = 1.80; // Implied prob: 55.56%
      const fairProbability = 50; // True prob: 50%
      const stake = 100;
      
      const ev = calculateExpectedValue(bookmakerOdds, fairProbability, stake);
      
      expect(ev.evPercentage).toBeLessThan(0); // Negative EV (fair 50% < implied 55.56%)
      expect(ev.evDollars).toBeLessThan(0);
    });

    it('should calculate zero EV when odds match fair price', () => {
      const bookmakerOdds = 2.00; // Implied prob: 50%
      const fairProbability = 50; // True prob: 50%
      const stake = 100;
      
      const ev = calculateExpectedValue(bookmakerOdds, fairProbability, stake);
      
      expect(ev.evPercentage).toBeCloseTo(0, 1);
      expect(ev.evDollars).toBeCloseTo(0, 1);
    });

    it('should scale EV dollars with stake', () => {
      const bookmakerOdds = 1.80;
      const fairProbability = 50;
      
      const ev100 = calculateExpectedValue(bookmakerOdds, fairProbability, 100);
      const ev200 = calculateExpectedValue(bookmakerOdds, fairProbability, 200);
      
      expect(ev200.evDollars).toBeCloseTo(ev100.evDollars * 2, 1);
      expect(ev200.evPercentage).toBe(ev100.evPercentage); // EV% stays the same
    });

    it('should follow the EV formula correctly', () => {
      const bookmakerOdds = 2.50; // Implied prob: 40%
      const fairProbability = 45; // True prob: 45%
      const stake = 100;
      
      // EV% = ((fairProb - impliedProb) / impliedProb) * 100
      // EV% = (0.45 - 0.4) / 0.4 * 100 = 12.5%
      const ev = calculateExpectedValue(bookmakerOdds, fairProbability, stake);
      
      expect(ev.evPercentage).toBeCloseTo(12.5, 1);
      expect(ev.evDollars).toBeCloseTo(12.5, 1);
    });

    it('should demonstrate fix: higher odds than fair gives positive EV', () => {
      // When bookmaker odds are HIGHER than fair odds, EV should be POSITIVE
      const bookmakerOdds = 2.5; // Implied prob: 40%
      const fairProbability = 50; // True prob: 50% (higher than implied)
      const stake = 100;
      
      // EV% = (odds * fairProb - 1) * 100 = (2.5 * 0.5 - 1) * 100 = 25%
      const ev = calculateExpectedValue(bookmakerOdds, fairProbability, stake);
      
      expect(ev.evPercentage).toBeCloseTo(25, 1); // Good bet: +25% EV
      expect(ev.evDollars).toBeCloseTo(25, 1);
    });

    it('should demonstrate fix: lower odds than fair gives negative EV', () => {
      // When bookmaker odds are LOWER than fair odds, EV should be NEGATIVE
      const bookmakerOdds = 1.67; // Implied prob: 60%
      const fairProbability = 50; // True prob: 50% (lower than implied)
      const stake = 100;
      
      // EV% = (odds * fairProb - 1) * 100 = (1.67 * 0.5 - 1) * 100 = -16.5%
      const ev = calculateExpectedValue(bookmakerOdds, fairProbability, stake);
      
      expect(ev.evPercentage).toBeCloseTo(-16.5, 0); // Bad bet: ~-16.5% EV
      expect(ev.evDollars).toBeCloseTo(-16.5, 0);
    });
  });

  describe('findBestArbitrage with EV', () => {
    it('should include EV calculations when sufficient bookmakers exist', () => {
      const event: OddsApiEvent = {
        id: 'test_ev_event_1',
        sport_key: 'basketball_nba',
        sport_title: 'Basketball - NBA',
        commence_time: new Date().toISOString(),
        home_team: 'Lakers',
        away_team: 'Warriors',
        bookmakers: [
          {
            key: 'bet365',
            title: 'Bet365',
            last_update: new Date().toISOString(),
            markets: [{
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Lakers', price: 2.10 },
                { name: 'Warriors', price: 2.00 },
              ]
            }]
          },
          {
            key: 'draftkings',
            title: 'DraftKings',
            last_update: new Date().toISOString(),
            markets: [{
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Lakers', price: 2.05 },
                { name: 'Warriors', price: 2.10 },
              ]
            }]
          },
          {
            key: 'fanduel',
            title: 'FanDuel',
            last_update: new Date().toISOString(),
            markets: [{
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Lakers', price: 2.08 },
                { name: 'Warriors', price: 2.05 },
              ]
            }]
          },
        ]
      };

      const opportunity = findBestArbitrage(event, 'h2h');
      
      expect(opportunity).not.toBeNull();
      expect(opportunity!.bookmakers[0].ev).toBeDefined();
      expect(opportunity!.bookmakers[0].evDollars).toBeDefined();
      expect(opportunity!.bookmakers[1].ev).toBeDefined();
      expect(opportunity!.bookmakers[1].evDollars).toBeDefined();
    });

    it('should not include EV when insufficient bookmakers', () => {
      const event: OddsApiEvent = {
        id: 'test_ev_event_2',
        sport_key: 'basketball_nba',
        sport_title: 'Basketball - NBA',
        commence_time: new Date().toISOString(),
        home_team: 'Lakers',
        away_team: 'Warriors',
        bookmakers: [
          {
            key: 'bet365',
            title: 'Bet365',
            last_update: new Date().toISOString(),
            markets: [{
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Lakers', price: 2.10 },
                { name: 'Warriors', price: 2.00 },
              ]
            }]
          },
          {
            key: 'draftkings',
            title: 'DraftKings',
            last_update: new Date().toISOString(),
            markets: [{
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Lakers', price: 2.05 },
                { name: 'Warriors', price: 2.10 },
              ]
            }]
          },
        ]
      };

      const opportunity = findBestArbitrage(event, 'h2h');
      
      expect(opportunity).not.toBeNull();
      expect(opportunity!.bookmakers[0].ev).toBeUndefined();
      expect(opportunity!.bookmakers[0].evDollars).toBeUndefined();
    });
  });

  describe('findPositiveEVOpportunities', () => {
    it('should find positive EV opportunities', () => {
      const events: OddsApiEvent[] = [
        {
          id: 'ev_event_1',
          sport_key: 'basketball_nba',
          sport_title: 'Basketball - NBA',
          commence_time: new Date().toISOString(),
          home_team: 'Lakers',
          away_team: 'Warriors',
          bookmakers: [
            {
              key: 'bet365',
              title: 'Bet365',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 2.00 },
                  { name: 'Warriors', price: 2.00 },
                ]
              }]
            },
            {
              key: 'draftkings',
              title: 'DraftKings',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 1.90 },
                  { name: 'Warriors', price: 2.10 },
                ]
              }]
            },
            {
              key: 'fanduel',
              title: 'FanDuel',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 1.95 },
                  { name: 'Warriors', price: 2.05 },
                ]
              }]
            },
          ]
        },
      ];

      const opportunities = findPositiveEVOpportunities(events);
      
      expect(opportunities.length).toBeGreaterThan(0);
      
      // All opportunities should have EV data
      opportunities.forEach(opp => {
        opp.bookmakers.forEach(bm => {
          expect(bm.ev).toBeDefined();
          expect(bm.evDollars).toBeDefined();
        });
      });
    });

    it('should filter by minimum EV percentage', () => {
      const events: OddsApiEvent[] = [
        {
          id: 'ev_event_2',
          sport_key: 'basketball_nba',
          sport_title: 'Basketball - NBA',
          commence_time: new Date().toISOString(),
          home_team: 'Lakers',
          away_team: 'Warriors',
          bookmakers: [
            {
              key: 'bet365',
              title: 'Bet365',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 2.00 },
                  { name: 'Warriors', price: 2.00 },
                ]
              }]
            },
            {
              key: 'draftkings',
              title: 'DraftKings',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 1.90 },
                  { name: 'Warriors', price: 2.10 },
                ]
              }]
            },
            {
              key: 'fanduel',
              title: 'FanDuel',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 1.95 },
                  { name: 'Warriors', price: 2.05 },
                ]
              }]
            },
          ]
        },
      ];

      const allOpportunities = findPositiveEVOpportunities(events, 0);
      const filteredOpportunities = findPositiveEVOpportunities(events, 5);
      
      expect(filteredOpportunities.length).toBeLessThanOrEqual(allOpportunities.length);
      
      filteredOpportunities.forEach(opp => {
        opp.bookmakers.forEach(bm => {
          if (bm.ev !== undefined) {
            expect(bm.ev).toBeGreaterThanOrEqual(5);
          }
        });
      });
    });

    it('should skip events with insufficient bookmakers', () => {
      const events: OddsApiEvent[] = [
        {
          id: 'ev_event_3',
          sport_key: 'basketball_nba',
          sport_title: 'Basketball - NBA',
          commence_time: new Date().toISOString(),
          home_team: 'Lakers',
          away_team: 'Warriors',
          bookmakers: [
            {
              key: 'bet365',
              title: 'Bet365',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 2.00 },
                  { name: 'Warriors', price: 2.00 },
                ]
              }]
            },
            {
              key: 'draftkings',
              title: 'DraftKings',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 1.90 },
                  { name: 'Warriors', price: 2.10 },
                ]
              }]
            },
          ]
        },
      ];

      const opportunities = findPositiveEVOpportunities(events);
      
      expect(opportunities.length).toBe(0); // Should skip due to insufficient bookmakers
    });

    it('should sort by highest EV', () => {
      const events: OddsApiEvent[] = [
        {
          id: 'ev_event_4',
          sport_key: 'basketball_nba',
          sport_title: 'Basketball - NBA',
          commence_time: new Date().toISOString(),
          home_team: 'Lakers',
          away_team: 'Warriors',
          bookmakers: [
            {
              key: 'bet365',
              title: 'Bet365',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 2.00 },
                  { name: 'Warriors', price: 2.00 },
                ]
              }]
            },
            {
              key: 'draftkings',
              title: 'DraftKings',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 1.90 },
                  { name: 'Warriors', price: 2.10 },
                ]
              }]
            },
            {
              key: 'fanduel',
              title: 'FanDuel',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Lakers', price: 1.95 },
                  { name: 'Warriors', price: 2.05 },
                ]
              }]
            },
          ]
        },
      ];

      const opportunities = findPositiveEVOpportunities(events);
      
      // Verify sorting by EV (descending)
      for (let i = 1; i < opportunities.length; i++) {
        const maxEVPrev = Math.max(...opportunities[i - 1].bookmakers.map(bm => bm.ev || 0));
        const maxEVCurrent = Math.max(...opportunities[i].bookmakers.map(bm => bm.ev || 0));
        expect(maxEVPrev).toBeGreaterThanOrEqual(maxEVCurrent);
      }
    });

    it('should correctly identify positive EV bets after fix', () => {
      // This test verifies the EV formula fix
      // When a bookmaker offers HIGHER odds than the fair market,
      // that represents a positive EV opportunity
      const events: OddsApiEvent[] = [
        {
          id: 'ev_fix_test',
          sport_key: 'basketball_nba',
          sport_title: 'Basketball - NBA',
          commence_time: new Date().toISOString(),
          home_team: 'Team A',
          away_team: 'Team B',
          bookmakers: [
            // Fair market is around 2.0 for both outcomes (50% probability each)
            {
              key: 'bet365',
              title: 'Bet365',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Team A', price: 2.00 },
                  { name: 'Team B', price: 2.00 },
                ]
              }]
            },
            {
              key: 'draftkings',
              title: 'DraftKings',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Team A', price: 2.05 },
                  { name: 'Team B', price: 1.95 },
                ]
              }]
            },
            {
              key: 'fanduel',
              title: 'FanDuel',
              last_update: new Date().toISOString(),
              markets: [{
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  // This bookmaker offers 2.20 for Team A - HIGHER than fair (2.0)
                  // This should be a positive EV bet
                  { name: 'Team A', price: 2.20 },
                  { name: 'Team B', price: 1.80 },
                ]
              }]
            },
          ]
        },
      ];

      const opportunities = findPositiveEVOpportunities(events, 0);
      
      expect(opportunities.length).toBeGreaterThan(0);
      
      // Find the FanDuel Team A bet (odds 2.20)
      const fanDuelTeamABet = opportunities[0].bookmakers.find(
        bm => bm.name === 'FanDuel' && bm.outcome === 'Team A'
      );
      
      expect(fanDuelTeamABet).toBeDefined();
      expect(fanDuelTeamABet!.odds).toBe(2.20);
      expect(fanDuelTeamABet!.ev).toBeGreaterThan(0); // Should be positive EV
      
      // Fair price for Team A is average of [2.00, 2.05, 2.20] = 48.97% implied prob
      // FanDuel offers 2.20 (45.45% implied prob)
      // EV = ((0.4897 - 0.4545) / 0.4545) * 100 ≈ 7.74%
      expect(fanDuelTeamABet!.ev).toBeCloseTo(7.74, 0);
    });
  });
});
