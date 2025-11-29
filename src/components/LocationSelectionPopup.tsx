import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService, LocationInfo } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface LocationSelectionPopupProps {
  userId: number;
  onLocationConfirmed: () => void;
}

export const LocationSelectionPopup = ({ userId, onLocationConfirmed }: LocationSelectionPopupProps) => {
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = locations.filter(loc =>
        loc.location_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations);
    }
  }, [searchQuery, locations]);

  const fetchLocations = async () => {
    try {
      const data = await apiService.getAllLocations();
      setLocations(data);
      setFilteredLocations(data);
    } catch (error: any) {
      // If 401 error, clear auth and redirect to login
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('qikpod_user');
        toast({
          title: "Session Expired",
          description: "Please login again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to fetch locations. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirm = async () => {
    if (!selectedLocationId) {
      toast({
        title: "Selection Required",
        description: "Please select a location to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiService.addUserLocation(userId, selectedLocationId);
      
      // Store location_id in localStorage
      localStorage.setItem('current_location_id', selectedLocationId);
      
      // Get and save location name
      const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
      if (selectedLocation) {
        localStorage.setItem('current_location_name', selectedLocation.location_name);
      }
      
      toast({
        title: "Success",
        description: "Location has been set successfully.",
      });
      onLocationConfirmed();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} modal={true}>
      <DialogContent className="min-w-[300px] max-w-[480px] mx-auto" hideClose>
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
          <DialogDescription>
            Please select your location to continue using the application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent>
              {filteredLocations.length > 0 ? (
                filteredLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.location_name}
                  </SelectItem>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No locations found
                </div>
              )}
            </SelectContent>
          </Select>

          <Button
            onClick={handleConfirm}
            disabled={!selectedLocationId || isLoading}
            className="w-full"
          >
            {isLoading ? "Confirming..." : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
