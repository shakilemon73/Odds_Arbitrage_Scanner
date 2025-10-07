import DashboardHeader from "../DashboardHeader";
import { ThemeProvider } from "../ThemeProvider";
import { useState } from "react";

export default function DashboardHeaderExample() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    console.log("Refresh triggered");
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <ThemeProvider>
      <DashboardHeader
        status="connected"
        onRefresh={handleRefresh}
        onSettingsClick={() => console.log("Settings clicked")}
        isRefreshing={isRefreshing}
      />
    </ThemeProvider>
  );
}
