import { useState } from "react";
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
import { Eye, EyeOff } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("oddsApiKey") || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [mockMode, setMockMode] = useState(() => localStorage.getItem("mockMode") === "true");

  // Auto-disable mock mode when API key is entered
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (value.trim().length > 0 && mockMode) {
      setMockMode(false);
    }
  };

  const handleSave = async () => {
    // Save to localStorage
    localStorage.setItem("oddsApiKey", apiKey);
    localStorage.setItem("mockMode", mockMode.toString());
    
    // Save to backend
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mockMode }),
      });
      console.log("Settings saved:", { apiKey: apiKey ? "***" : "empty", mockMode });
    } catch (error) {
      console.error("Failed to save settings to backend:", error);
    }
    
    onOpenChange(false);
    
    // Force a refresh to apply new settings
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-settings">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your API settings and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">The Odds API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="pr-10"
                data-testid="input-api-key"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
                data-testid="button-toggle-api-key"
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://the-odds-api.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                the-odds-api.com
              </a>
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mock-mode">Mock Data Mode</Label>
              <p className="text-xs text-muted-foreground">
                {mockMode 
                  ? "Using simulated data (no API key needed)"
                  : apiKey.trim()
                    ? "Using live data from The Odds API"
                    : "Enter an API key to use live data"}
              </p>
            </div>
            <Switch
              id="mock-mode"
              checked={mockMode}
              onCheckedChange={setMockMode}
              data-testid="switch-mock-mode"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
