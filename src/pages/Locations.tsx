import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight, Plus, ArrowLeft } from "lucide-react";
import { getUserData, isLoggedIn, saveLastLocation, saveLocationId } from "@/utils/storage";
import { UserLocation } from "@/services/api";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function Locations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    loadUserLocations();
  }, [navigate]);

  const loadUserLocations = async () => {
    const user = getUserData();
    if (!user) return;
    try {
      setLoading(true);
      const userLocations = await apiService.getUserLocations(user.id);
      setLocations(userLocations);
    } catch (error) {
      console.error("Error loading user locations:", error);
      toast({
        title: "Error",
        description: "Failed to load your locations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: UserLocation) => {
    saveLastLocation(location.location_name);
    saveLocationId(location.location_id.toString());
    navigate("/customer-dashboard");
  };

  const user = getUserData();

  return (
    <div className="min-h-screen bg-background text-xs">
      {/* Main Content */}
      <div className="p-4 max-w-md mx-auto py-0">
        <div className="space-y-3 py-[10px]">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Select Location</h1>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="w-5 h-5 bg-muted rounded"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : locations.length === 0 ? (
            <div className="bg-secondary rounded-xl p-4">
              <div className="text-center py-8">
                <p className="text-muted-foreground">No locations found</p>
                <p className="text-sm text-muted-foreground mt-1">Add a new location by scanning a QR code</p>
              </div>
            </div>
          ) : (
            <div className="bg-secondary rounded-xl p-4 my-[10px]">
              <div className="space-y-3">
                {locations.map((location) => (
                  <Card
                    key={location.id}
                    className="card-modern p-4 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleLocationSelect(location)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{location.location_name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{location.location_address}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-muted-foreground">PIN: {location.location_pincode}</span>
                            <span
                              className={`text-xs font-medium ${
                                location.status.toLowerCase() === "active" ? "text-green-600" : "text-muted-foreground"
                              }`}
                            >
                              {location.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-5 h-5 flex items-center justify-center ml-2 shrink-0">
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
