import EmptyState from "../EmptyState";

export default function EmptyStateExample() {
  return (
    <EmptyState onRefresh={() => console.log("Refresh clicked")} />
  );
}
