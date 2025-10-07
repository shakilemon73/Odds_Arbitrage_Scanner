import { describe, it, expect } from '@jest/globals';
import {
  calculateImpliedProbability,
  calculateArbitrage,
  calculateKellyStake,
  findBestArbitrage,
  findAllArbitrageOpportunities,
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
});
