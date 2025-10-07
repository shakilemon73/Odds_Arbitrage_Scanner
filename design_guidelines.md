# Design Guidelines: Odds Arbitrage Scanner

## Design Approach: Material Design System
**Rationale:** This is a data-intensive, utility-focused application where efficiency, clarity, and quick decision-making are paramount. Material Design provides excellent patterns for data visualization, tables, and information hierarchy—perfect for displaying real-time odds and arbitrage calculations.

## Core Design Principles
1. **Data First:** Every design decision prioritizes clarity and scannability of odds data
2. **Speed to Action:** Users should identify and act on opportunities in seconds
3. **Visual Hierarchy:** Critical information (profit %, stakes) must stand out immediately
4. **Consistent Patterns:** Familiar UI allows users to focus on data, not navigation

## Color Palette

**Light Mode:**
- Primary: 220 80% 45% (Deep blue for trust and professionalism)
- Success/Positive: 142 70% 45% (Green for profitable arbitrage)
- Background: 220 15% 98% (Soft neutral background)
- Surface: 0 0% 100% (Pure white cards)
- Text Primary: 220 15% 15%
- Text Secondary: 220 10% 45%

**Dark Mode:**
- Primary: 220 80% 60% (Brighter blue for contrast)
- Success/Positive: 142 65% 55% (Vibrant green for profits)
- Background: 220 15% 10% (Deep dark background)
- Surface: 220 12% 14% (Elevated dark cards)
- Text Primary: 220 15% 95%
- Text Secondary: 220 10% 70%

**Data Visualization Colors:**
- Profit indicators: Green scale (142 degrees hue)
- Warning/Low margin: Amber (45 60% 55%)
- Critical values: Red (0 70% 55%)

## Typography
- **Primary Font:** Inter (via Google Fonts CDN)
- **Monospace Font:** JetBrains Mono (for odds/numbers)
- Headings: Inter Semi-bold (600)
- Body: Inter Regular (400)
- Data/Numbers: JetBrains Mono Medium (500)
- Sizes: text-xs for labels, text-sm for secondary data, text-base for primary content, text-lg for headers, text-2xl for dashboard title

## Layout System
**Spacing Units:** Use Tailwind units of 2, 4, 6, 8, 12, 16 (e.g., p-4, m-8, gap-6)
- Card padding: p-6
- Section spacing: mb-8 or mb-12
- Grid gaps: gap-4 or gap-6
- Container max-width: max-w-7xl with px-4 for mobile, px-6 for tablet, px-8 for desktop

## Component Library

**Dashboard Layout:**
- Top Navigation: Fixed header with logo, refresh button, settings icon, and API status indicator
- Filters Bar: Sticky below header with sport selector, bookmaker filters, and minimum profit slider
- Main Content: Grid of arbitrage opportunity cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Empty State: When no opportunities, show centered message with refresh CTA

**Arbitrage Opportunity Cards:**
- Material Design elevated cards (shadow-md with hover:shadow-lg)
- Header: Sport icon + match details
- Odds Display: Two or three column layout showing bookmaker, odds, and stake
- Profit Badge: Prominent pill badge showing profit percentage (top-right corner)
- Footer: Timestamp and "View Details" link
- Color coding: Green border-l-4 for high-profit (>3%), amber for medium (1-3%)

**Data Tables (for detailed view):**
- Striped rows for scannability
- Sticky header on scroll
- Monospace font for all numerical data
- Sort indicators on column headers
- Highlight row on hover (bg-gray-50 dark:bg-gray-800)

**Settings Page:**
- Single column form layout (max-w-2xl centered)
- Material Design text inputs with floating labels
- API key input with show/hide toggle
- Mock mode toggle switch with clear explanation
- Save button (primary color, full-width on mobile)

**Filters & Controls:**
- Chip-based multi-select for bookmakers (Material Design chips)
- Dropdown for sport selection
- Range slider for minimum profit threshold with live value display
- Clear all filters button (text button, subtle)

**Status Indicators:**
- API Connection: Green dot for connected, red for disconnected, yellow for cached
- Real-time indicator: Pulsing green dot when live data is active
- Loading states: Material Design circular progress spinners

**Empty & Error States:**
- Centered content with illustrative icon
- Clear message explaining the state
- Primary action button to resolve (Refresh, Configure API, etc.)

## Responsive Behavior
- Mobile (< 768px): Single column cards, collapsible filters in drawer
- Tablet (768px - 1024px): Two column card grid
- Desktop (> 1024px): Three column card grid, persistent filter sidebar

## Key UX Patterns
1. **Quick Scan:** Card-based layout allows rapid visual scanning for profit opportunities
2. **Progressive Disclosure:** Summary on cards, detailed breakdown on click/expand
3. **Live Updates:** Subtle animation when new opportunities appear (fade-in)
4. **Confidence Indicators:** Show data freshness with timestamp and cache status
5. **Keyboard Shortcuts:** Support for refresh (Cmd/Ctrl+R), settings (Cmd/Ctrl+,)

## Images
**Hero/Header:** No traditional hero image needed for this utility app. Instead, use a compact branded header with:
- Logo/app name on left
- Real-time status indicator in center
- Settings and refresh controls on right
- Subtle gradient background (220 80% 45% to 220 80% 35%)

**Icons:** Use Material Icons CDN for:
- Sport icons (sports_soccer, sports_basketball, sports_tennis)
- UI controls (refresh, settings, filter_list, trending_up)
- Status indicators (check_circle, error, cached)

## Animations
**Minimal, Purposeful Only:**
- New opportunity cards: Gentle fade-in and slide-up (200ms)
- Data refresh: Pulse animation on refresh button during fetch
- Card hover: Subtle elevation change (shadow transition 150ms)
- NO continuous animations or distracting effects

## Accessibility
- Maintain 4.5:1 contrast ratio for all text
- Profit percentages also indicated by color AND position/icon (not color alone)
- Keyboard navigation support for all interactive elements
- ARIA labels for icon-only buttons
- Focus indicators visible in both light and dark modes