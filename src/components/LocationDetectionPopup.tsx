import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "sonner";

interface LocationDetectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  locationId: string;
}

export function LocationDetectionPopup({ isOpen, onClose, userId, locationId }: LocationDetectionPopupProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await apiService.addUserLocation(userId, locationId);
      toast.success("Location added successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to add location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[300px] max-w-[480px] mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-primary" />
            <DialogTitle>New Location Detected</DialogTitle>
          </div>
          <DialogDescription>
            You're in a new location. Do you want to add this location to your locations list?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="flex-1" 
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}