# Odds Arbitrage Scanner

## Overview

A real-time sports betting arbitrage opportunity scanner that identifies profitable betting scenarios across multiple bookmakers. The application fetches live odds from The Odds API, calculates arbitrage opportunities using sophisticated mathematical algorithms, and presents them in a clean, data-focused interface. Built for speed and clarity, enabling users to identify and act on arbitrage opportunities within seconds.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Framework:**
- Shadcn UI component library built on Radix UI primitives
- Sidebar layout using Shadcn sidebar primitives for navigation and filters
- Tailwind CSS for styling with custom design system
- Professional dashboard design principles for data-intensive interfaces
- Custom CSS variables for theming (light/dark mode support)
- Stats overview cards for key metrics display
- Dual view modes: Card grid and Table view with toggle

**Design System:**
- DELLTA-inspired professional dark theme with sidebar layout
- Lucide React icons for consistent iconography
- Inter font family for general UI
- JetBrains Mono for numerical data display (odds, stakes, percentages)
- Color palette: Deep dark backgrounds (5-8% lightness) with cyan/turquoise primary (188 95% 55%) and purple accent (268 85% 65%)
- Bright success green (158 88% 50%) for profit indicators
- High contrast for enhanced readability
- Responsive design with mobile-first approach

**State Management:**
- React Query for API data fetching and caching with configurable stale times
- Local storage for user preferences (API keys, mock mode settings)
- React Context for theme management (light/dark mode)
- URL query parameters for filter state persistence

### Backend Architecture

**Core Framework:**
- Node.js with Express server
- TypeScript for type safety across the stack
- ESM module system

**Arbitrage Engine:**
- Advanced mathematical calculations for 2-way and 3-way betting markets
- Implied probability calculations from decimal odds
- Equal-profit stake distribution algorithms
- Kelly Criterion support for stake sizing
- Comprehensive unit testing for calculation accuracy

**API Design Pattern:**
- RESTful endpoints with Zod schema validation
- Shared type definitions between client and server via `/shared` directory
- Error handling middleware with structured error responses
- Request logging with performance metrics

**Key Endpoints:**
- `GET /api/odds` - Returns calculated arbitrage opportunities with optional filtering
- `GET /healthz` - Health check endpoint for monitoring

**Caching Strategy:**
- In-memory cache with configurable TTL (30-60 seconds default)
- Cache key generation based on request parameters
- Automatic cache invalidation on expiry
- Separate caching layers for odds data and calculated opportunities

### Data Flow Architecture

**Provider Interface Pattern:**
- Abstract `OddsProvider` interface for pluggable data sources
- Current implementation: The Odds API provider
- Mock provider for development and testing (activated via `MOCK_ODDS=true`)
- Future-ready for multiple provider support

**Data Processing Pipeline:**
1. Fetch raw odds from provider (with caching)
2. Normalize bookmaker data to common format
3. Calculate arbitrage opportunities using the arbitrage engine
4. Filter results based on query parameters (sport, bookmaker, min profit)
5. Return formatted response to client

**Normalization Process:**
- Maps provider-specific odds formats to internal schema
- Handles 2-way markets (e.g., tennis) and 3-way markets (e.g., soccer)
- Validates data integrity using Zod schemas

### Database Architecture

**Current State:**
- In-memory storage for settings and cached opportunities
- No persistent database currently implemented
- Drizzle ORM configured for future PostgreSQL integration

**Future Migration Path:**
- Drizzle schema definitions in `/shared/schema.ts`
- PostgreSQL via Neon serverless connector planned
- Migration files directory structure ready (`/migrations`)
- Session management with connect-pg-simple configured

**Storage Interface:**
- `IStorage` interface for abstraction
- `MemStorage` implementation for current in-memory operations
- Settings management (mock mode, cache timeout)
- Opportunities caching layer

### Build and Deployment

**Development Workflow:**
- Vite dev server with HMR for frontend (port 5173)
- tsx for TypeScript execution in development
- Express server (port 8080 or configured PORT)
- Source map support for debugging

**Production Build:**
- Vite builds client code to `/dist/public`
- esbuild bundles server code to `/dist`
- Single unified build output directory
- Static file serving in production mode

**Environment Configuration:**
- `.env` files for environment variables
- `DATABASE_URL` for future PostgreSQL connection
- `ODDS_API_KEY` for The Odds API integration
- `MOCK_ODDS` flag for development mode
- `NODE_ENV` for environment detection

**Docker Support:**
- Dockerized containers ready (referenced in spec)
- docker-compose for local development
- Separate frontend and backend containers

## External Dependencies

### Third-Party APIs

**The Odds API (Primary Data Source):**
- Live odds fetching for soccer, basketball, and tennis
- Endpoints: `/sports/{sport_key}/odds`
- Rate limiting considerations (30-60 second caching)
- API key authentication via headers or environment variables
- Mock mode available for development without API consumption

### UI Component Libraries

**Radix UI Primitives:**
- Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu
- Popover, Select, Slider, Switch, Tabs, Toast, Tooltip
- Navigation Menu, Context Menu, Hover Card
- All primitives provide accessibility features out of the box

**Additional UI Dependencies:**
- `embla-carousel-react` for carousel components
- `cmdk` for command palette functionality
- `vaul` for drawer components
- `react-day-picker` for date selection
- `input-otp` for OTP input fields

### Data Validation and Type Safety

**Zod:**
- Runtime type validation for API requests/responses
- Schema definitions shared between client and server
- Integration with React Hook Form via `@hookform/resolvers`
- Drizzle-zod for database schema validation

### Styling and Design

**Tailwind CSS Ecosystem:**
- Core Tailwind CSS framework
- `tailwindcss-animate` for animations
- Custom configuration with design tokens
- PostCSS for processing

**Icon Libraries:**
- Lucide React for primary iconography (TrendingUp, Settings, LayoutGrid, TableIcon, etc.)

### Utility Libraries

**Class and Style Management:**
- `clsx` and `class-variance-authority` for conditional classes
- `tailwind-merge` for class deduplication

**Date Handling:**
- `date-fns` for date formatting and manipulation

**Routing:**
- `wouter` for lightweight client-side routing

### Development Tools

**Replit-Specific Plugins:**
- `@replit/vite-plugin-runtime-error-modal` for error overlay
- `@replit/vite-plugin-cartographer` for code mapping
- `@replit/vite-plugin-dev-banner` for development indicators

### Database and ORM

**Drizzle ORM:**
- `drizzle-orm` for type-safe database queries
- `drizzle-kit` for migrations
- `@neondatabase/serverless` for PostgreSQL connection
- `connect-pg-simple` for session storage (future implementation)

### Testing Framework

**Jest (Planned):**
- Unit tests for arbitrage calculation engine
- Test coverage for 2-way and 3-way market calculations
- Positive and negative test scenarios

### Future Integrations (Documented in Spec)

- SQLite/PostgreSQL persistence layer
- Telegram bot for arbitrage alerts
- Multi-provider odds aggregation
- User authentication system
- Deployment to Vercel (frontend) and Render/Fly.io (backend)