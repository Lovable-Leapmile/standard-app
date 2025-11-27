import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserData, isLoggedIn } from "@/utils/storage";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { LocationDetectionPopup } from "@/components/LocationDetectionPopup";
import { useLocationDetection } from "@/hooks/useLocationDetection";

interface RTOReservation {
  id: string;
  pod_name?: string;
  rto_otp?: string;
  location_name?: string;
  drop_by_phone?: string;
  reservation_awbno?: string;
  reservation_status: string;
}

export default function RTO() {
  const navigate = useNavigate();
  const user = getUserData();
  const [reservations, setReservations] = useState<RTOReservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Location detection
  const currentLocationId = localStorage.getItem("current_location_id");
  const { showLocationPopup, closeLocationPopup } = useLocationDetection(user?.id, currentLocationId);

  // Authentication and authorization check
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    // Only allow SiteAdmin access
    if (user?.user_type !== "SiteAdmin") {
      navigate("/login");
      toast.error("Access denied. Only Site Admin can access this page.");
      return;
    }

    // Only set authorized if user is logged in AND is SiteAdmin
    setIsAuthorized(true);
  }, [navigate, user]);

  // Load reservations function - only if authorized
  const loadRTOReservations = useCallback(async () => {
    if (!currentLocationId || !isAuthorized) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.getLocationReservations(currentLocationId, "RTOPending");

      let reservationsArray: RTOReservation[] = [];

      if (Array.isArray(response)) {
        reservationsArray = response;
      } else if (response && typeof response === "object") {
        if (Array.isArray((response as any).records)) {
          reservationsArray = (response as any).records;
        } else if (Array.isArray((response as any).data)) {
          reservationsArray = (response as any).data;
        } else if (Array.isArray((response as any).reservations)) {
          reservationsArray = (response as any).reservations;
        }
      }

      // Filter for RTOPending status only
      const rtoPendingOnly = reservationsArray.filter((item: any) => item.reservation_status === "RTOPending");

      const transformedReservations = rtoPendingOnly.map((item: any) => ({
        id: item.id || "",
        pod_name: item.pod_name || "",
        rto_otp: item.rto_otp || "",
        location_name: item.location_name || "",
        drop_by_phone: item.drop_by_phone || "",
        reservation_awbno: item.reservation_awbno || "",
        reservation_status: item.reservation_status || "",
      }));

      setReservations(transformedReservations);
    } catch (error: any) {
      console.error("Error loading RTO reservations:", error);
      toast.error(`Failed to load RTO reservations: ${error.message || "Unknown error"}`);
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentLocationId, isAuthorized]);

  // Create a ref for the load function
  const loadRTOReservationsRef = useRef(loadRTOReservations);
  useEffect(() => {
    loadRTOReservationsRef.current = loadRTOReservations;
  }, [loadRTOReservations]);

  // Load data only when authorized
  useEffect(() => {
    if (currentLocationId && isAuthorized) {
      loadRTOReservationsRef.current();
    }
  }, [currentLocationId, isAuthorized]);

  const handleRefresh = () => {
    if (!isAuthorized) return;
    loadRTOReservations();
  };

  // Show loading while checking authorization
  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/site-admin-dashboard")} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">RTO Pending</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </header>

        {/* Location Warning */}
        {!currentLocationId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ No location selected. Please select a location to view RTO reservations.
            </p>
          </div>
        )}

        {/* Content */}
        {!currentLocationId ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Please select a location to view RTO reservations</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading RTO pending reservations...</p>
            </div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No RTO pending reservations found.</p>
          </div>
        ) : (
          <ul className="space-y-3" role="list" aria-label="RTO Pending Reservations">
            {reservations.map((reservation) => (
              <li key={reservation.id}>
                <Card className="p-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">Pod name</span>
                      <span className="text-foreground">{reservation.pod_name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">Rto OTP</span>
                      <span className="text-foreground font-mono">{reservation.rto_otp || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">Location Name</span>
                      <span className="text-foreground">{reservation.location_name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">Drop by Number</span>
                      <span className="text-foreground">{reservation.drop_by_phone || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">AWB Number</span>
                      <span className="text-foreground">{reservation.reservation_awbno || "N/A"}</span>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Location Detection Popup */}
      <LocationDetectionPopup
        isOpen={showLocationPopup}
        onClose={closeLocationPopup}
        userId={user?.id || 0}
        locationId={currentLocationId || ""}
      />
    </div>
  );
}
