# Odds Arbitrage Scanner (arb-scanner)

A full-stack web application that scans live bookmaker odds and identifies arbitrage opportunities across multiple sports and bookmakers.

## Features

- **Real-time Odds Scanning**: Integrates with The Odds API to fetch live odds from multiple bookmakers
- **Arbitrage Detection**: Advanced algorithm to identify profitable arbitrage opportunities
- **Multi-Sport Support**: Soccer (EPL, La Liga, Bundesliga), Basketball (NBA), American Football (NFL), and Tennis (ATP)
- **Mock Mode**: Test the application without using API credits
- **Responsive Dashboard**: Clean, modern UI with real-time updates and filtering
- **Smart Caching**: 60-second cache to minimize API calls and costs
- **Kelly Criterion**: Optimal stake sizing calculations for risk management

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Testing**: Jest with comprehensive test suite
- **Deployment**: Docker + docker-compose
- **API**: The Odds API integration

## Quick Start

### Prerequisites

- Node.js 20+ and npm
- The Odds API key (get one at [https://the-odds-api.com/](https://the-odds-api.com/))
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd arb-scanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API key:
   ```
   ODDS_API_KEY=your_actual_api_key_here
   MOCK_ODDS=false
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000`

### Mock Mode (No API Key Required)

To test the application without an API key:

1. Set `MOCK_ODDS=true` in your `.env` file
2. Run `npm run dev`
3. The app will use simulated data with realistic arbitrage opportunities

## API Endpoints

### GET /api/odds
Fetch current arbitrage opportunities.

**Query Parameters:**
- `sports` (optional): Comma-separated list of sports (e.g., `soccer_epl,basketball_nba`)
- `minProfit` (optional): Minimum profit percentage (e.g., `2.5`)
- `bookmakers` (optional): Filter by specific bookmakers

**Response:**
```json
{
  "opportunities": [
    {
      "id": "unique-id",
      "sport": "Basketball - NBA",
      "match": "Lakers vs Warriors",
      "bookmakers": [
        {
          "name": "Bet365",
          "outcome": "Lakers",
          "odds": 2.10,
          "stake": 487.80
        },
        {
          "name": "DraftKings",
          "outcome": "Warriors",
          "odds": 2.05,
          "stake": 512.20
        }
      ],
      "profit": 2.44,
      "timestamp": "2025-01-07T15:30:00.000Z"
    }
  ],
  "count": 1,
  "cachedAt": "2025-01-07T15:30:00.000Z"
}
```

### GET /healthz
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-07T15:30:00.000Z",
  "services": {
    "api": true,
    "cache": true
  }
}
```

## Testing

### Run Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

The test suite includes:
- Implied probability calculations
- Arbitrage detection for 2-way and 3-way markets
- Equal profit validation across all outcomes
- Kelly Criterion stake sizing
- Edge cases and negative scenarios

## Docker Deployment

### Build and Run with Docker Compose

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

The application will be available at `http://localhost:8080`

### Production Docker Build

```bash
# Build production image
docker build -t arb-scanner .

# Run container
docker run -p 8080:8080 \
  -e ODDS_API_KEY=your_key_here \
  -e MOCK_ODDS=false \
  arb-scanner
```

## Project Structure

```
arb-scanner/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
│   └── index.html
├── server/                # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── arbitrage-engine.ts # Arbitrage calculations
│   ├── odds-provider.ts   # API integration
│   └── storage.ts         # In-memory storage
├── shared/                # Shared types and schemas
│   └── schema.ts
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose setup
├── jest.config.js         # Jest configuration
└── package.json           # Dependencies and scripts
```

## How It Works

### 1. Data Collection
The application fetches live odds from The Odds API for selected sports and bookmakers. Responses are cached for 60 seconds to minimize API usage.

### 2. Arbitrage Detection
For each event, the engine:
1. Identifies the best odds for each possible outcome across all bookmakers
2. Calculates the total implied probability
3. If total implied probability < 100%, an arbitrage opportunity exists
4. Calculates optimal stakes for equal profit across all outcomes

### 3. Stake Calculation
The engine uses the formula:
```
stake_i = (total_stake × implied_prob_i) / total_implied_probability
```

This ensures equal profit regardless of which outcome occurs.

### 4. Kelly Criterion (Optional)
For advanced users, the Kelly Criterion calculates optimal bet sizing based on edge and bankroll:
```
f* = (bp - q) / b
```
where:
- `b` = odds - 1 (net odds)
- `p` = probability of winning
- `q` = probability of losing (1 - p)

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ODDS_API_KEY` | Your The Odds API key | - | Yes (unless MOCK_ODDS=true) |
| `MOCK_ODDS` | Use mock data instead of real API | `false` | No |
| `PORT` | Server port | `5000` | No |
| `NODE_ENV` | Environment (`development`/`production`) | `development` | No |
| `CACHE_TTL` | Cache timeout in seconds | `60` | No |

### Supported Sports

- `soccer_epl` - English Premier League
- `soccer_spain_la_liga` - Spanish La Liga
- `soccer_germany_bundesliga` - German Bundesliga
- `basketball_nba` - NBA Basketball
- `americanfootball_nfl` - NFL Football
- `tennis_atp` - ATP Tennis

## Future Enhancements

1. **Database Persistence**: SQLite integration via Prisma for historical data
2. **Telegram Alerts**: Real-time notifications for high-profit opportunities
3. **Multi-Provider Support**: Additional odds providers beyond The Odds API
4. **User Authentication**: Secure user accounts and personalized settings
5. **Profit Tracking**: Historical performance and ROI analytics

## API Rate Limits

The Odds API has the following limits:
- Free tier: 500 requests/month
- Each sport query = 1 request
- Cache helps minimize requests

**Tip**: Use mock mode for development to preserve your API quota.

## Troubleshooting

### Issue: "No arbitrage opportunities found"
- **Solution**: Real arbitrage opportunities are rare. Try using mock mode or checking different sports.

### Issue: "API key invalid"
- **Solution**: Verify your API key is correct in `.env` and restart the server.

### Issue: "Port 5000 already in use"
- **Solution**: Change the `PORT` variable in `.env` to a different port.

### Issue: Tests failing
- **Solution**: Ensure all dependencies are installed with `npm install`

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check existing GitHub issues
- Review the troubleshooting section
- Contact: [Your contact information]

## Acknowledgments

- The Odds API for providing reliable odds data
- Replit for the development platform
- Open source community for the tech stack

---

**Disclaimer**: This tool is for educational purposes only. Sports betting may be illegal in your jurisdiction. Always gamble responsibly and within your means.
