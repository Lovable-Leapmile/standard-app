import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ApiBaseUrlPopupProps {
  open: boolean;
  onSubmit: (baseUrl: string) => void;
}

export const ApiBaseUrlPopup = ({ open, onSubmit }: ApiBaseUrlPopupProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (input.trim()) {
      // Construct the full API URL: https://{input}.com/podcore
      const fullUrl = `https://${input.trim()}.com/podcore`;
      onSubmit(fullUrl);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure API Base URL</DialogTitle>
          <DialogDescription>
            Please enter your domain to connect to the API server. This is required for the application to function.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-domain">Domain</Label>
            <Input
              id="api-domain"
              placeholder="e.g., testhostharan.leapmile"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Example: testhostharan.leapmile
            </p>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!input.trim()}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
