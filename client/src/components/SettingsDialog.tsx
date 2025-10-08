import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { queryClient } from "@/lib/queryClient";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [mockMode, setMockMode] = useState(() => localStorage.getItem("mockMode") === "true");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30);
  const [showMockData, setShowMockData] = useState(true);
  const [showLiveData, setShowLiveData] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationProfitThreshold, setNotificationProfitThreshold] = useState(2);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(false);
  const [minEVPercentage, setMinEVPercentage] = useState(2);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (open) {
      loadSettings();
      setApiKey(localStorage.getItem("oddsApiKey") || "");
    }
  }, [open]);

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const settings = await response.json();
        setAutoRefreshInterval(settings.autoRefreshInterval || 30);
        setMockMode(settings.mockMode || false);
        setShowMockData(settings.showMockData ?? true);
        setShowLiveData(settings.showLiveData ?? true);
        setNotificationsEnabled(settings.notificationsEnabled || false);
        setNotificationProfitThreshold(settings.notificationProfitThreshold || 2);
        setNotificationSoundEnabled(settings.notificationSoundEnabled || false);
        setMinEVPercentage(settings.minEVPercentage || 2);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoadingSettings(false);
    }
  };


  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mockMode,
          autoRefreshInterval,
          showMockData,
          showLiveData,
          notificationsEnabled,
          notificationProfitThreshold,
          notificationSoundEnabled,
          minEVPercentage
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      localStorage.setItem("mockMode", mockMode.toString());
      localStorage.setItem("oddsApiKey", apiKey);
      
      // Invalidate all odds queries to force immediate refetch with new settings
      // Use predicate to match any query key that starts with /api/odds
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/odds');
        }
      });
      
      setIsSaving(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveError("Failed to save. Please try again.");
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setMockMode(localStorage.getItem("mockMode") === "true");
    setSaveError(null);
    loadSettings();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-settings" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription id="dialog-description">
            Configure API and data preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="api-key">The Odds API Key</Label>
              <p className="text-xs text-muted-foreground">
                Enter your API key from{" "}
                <a 
                  href="https://the-odds-api.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  the-odds-api.com
                </a>
              </p>
            </div>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              data-testid="input-api-key"
              disabled={isLoadingSettings}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="mock-mode">Mock Data Mode</Label>
              <p className="text-xs text-muted-foreground">
                {mockMode 
                  ? "Using simulated data for testing"
                  : "Using live data from The Odds API"}
              </p>
            </div>
            <Switch
              id="mock-mode"
              checked={mockMode}
              onCheckedChange={setMockMode}
              data-testid="switch-mock-mode"
              aria-label="Toggle mock data mode"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-refresh">Auto-Refresh Interval</Label>
              <span className="text-sm font-medium text-muted-foreground" data-testid="text-refresh-value">
                {autoRefreshInterval}s
              </span>
            </div>
            <Slider
              id="auto-refresh"
              min={10}
              max={300}
              step={10}
              value={[autoRefreshInterval]}
              onValueChange={(value) => setAutoRefreshInterval(value[0])}
              data-testid="slider-auto-refresh"
              aria-label="Auto-refresh interval in seconds"
              disabled={isLoadingSettings}
            />
            <p className="text-xs text-muted-foreground">
              How often to automatically refresh odds data (10-300 seconds)
            </p>
          </div>

          <div className="space-y-4 pt-2 border-t">
            <Label className="text-base">Data Sources</Label>
            
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="show-mock">Show Mock Data</Label>
                <p className="text-xs text-muted-foreground">
                  Display simulated arbitrage opportunities
                </p>
              </div>
              <Switch
                id="show-mock"
                checked={showMockData}
                onCheckedChange={setShowMockData}
                data-testid="switch-show-mock"
                aria-label="Toggle mock data display"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="show-live">Show Live Data</Label>
                <p className="text-xs text-muted-foreground">
                  Display real-time API data from The Odds API
                </p>
              </div>
              <Switch
                id="show-live"
                checked={showLiveData}
                onCheckedChange={setShowLiveData}
                data-testid="switch-show-live"
                aria-label="Toggle live data display"
              />
            </div>
          </div>

          {/* Task 11: Notification Settings */}
          <div className="space-y-4 pt-2 border-t">
            <Label className="text-base">Notifications</Label>
            
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get alerted when new opportunities appear
                </p>
              </div>
              <Switch
                id="notifications-enabled"
                checked={notificationsEnabled}
                onCheckedChange={async (checked) => {
                  if (checked && Notification.permission !== "granted") {
                    await Notification.requestPermission();
                  }
                  setNotificationsEnabled(checked);
                }}
                data-testid="switch-notifications"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notification-threshold">Min Profit Threshold</Label>
                <span className="text-sm font-medium text-muted-foreground">
                  {notificationProfitThreshold}%
                </span>
              </div>
              <Slider
                id="notification-threshold"
                min={1}
                max={10}
                step={0.5}
                value={[notificationProfitThreshold]}
                onValueChange={(value) => setNotificationProfitThreshold(value[0])}
                data-testid="slider-notification-threshold"
                disabled={!notificationsEnabled}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="notification-sound">Notification Sound</Label>
                <p className="text-xs text-muted-foreground">
                  Play sound with notifications
                </p>
              </div>
              <Switch
                id="notification-sound"
                checked={notificationSoundEnabled}
                onCheckedChange={setNotificationSoundEnabled}
                data-testid="switch-notification-sound"
                disabled={!notificationsEnabled}
              />
            </div>
          </div>

          {/* Task 8: +EV Settings */}
          <div className="space-y-4 pt-2 border-t">
            <Label className="text-base">+EV Opportunities</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="min-ev">Minimum EV%</Label>
                <span className="text-sm font-medium text-muted-foreground">
                  {minEVPercentage}%
                </span>
              </div>
              <Slider
                id="min-ev"
                min={0}
                max={10}
                step={0.5}
                value={[minEVPercentage]}
                onValueChange={(value) => setMinEVPercentage(value[0])}
                data-testid="slider-min-ev"
              />
              <p className="text-xs text-muted-foreground">
                Only show +EV bets above this threshold
              </p>
            </div>
          </div>

          {saveError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20" role="alert">
              <p className="text-sm text-destructive">{saveError}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            data-testid="button-cancel"
            disabled={isSaving}
            className="h-11 px-6"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            data-testid="button-save"
            disabled={isSaving}
            aria-label={isSaving ? "Saving settings" : "Save settings"}
            className="h-11 px-6"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
