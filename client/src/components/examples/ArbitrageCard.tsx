import ArbitrageCard, { type ArbitrageOpportunity } from "../ArbitrageCard";

const mockOpportunity: ArbitrageOpportunity = {
  id: "1",
  sport: "Soccer",
  match: "Man City vs Arsenal",
  bookmakers: [
    { name: "Bet365", outcome: "Home", odds: 2.10, stake: 476 },
    { name: "DraftKings", outcome: "Away", odds: 3.50, stake: 286 },
    { name: "FanDuel", outcome: "Draw", odds: 3.80, stake: 263 },
  ],
  profit: 3.2,
  timestamp: new Date().toISOString(),
};

export default function ArbitrageCardExample() {
  return (
    <div className="p-8 max-w-md">
      <ArbitrageCard
        opportunity={mockOpportunity}
        onClick={() => console.log("Card clicked")}
      />
    </div>
  );
}
