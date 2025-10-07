import StatusIndicator from "../StatusIndicator";

export default function StatusIndicatorExample() {
  return (
    <div className="p-8 space-y-4">
      <StatusIndicator status="connected" />
      <StatusIndicator status="cached" />
      <StatusIndicator status="disconnected" />
    </div>
  );
}
