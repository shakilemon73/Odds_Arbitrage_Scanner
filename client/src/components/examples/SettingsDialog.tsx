import SettingsDialog from "../SettingsDialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SettingsDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)}>Open Settings</Button>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
