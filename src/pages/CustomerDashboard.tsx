import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, MapPin } from "lucide-react";
import { apiService, Reservation as APIReservation } from "@/services/api";
import { getUserData, isLoggedIn, getPodName, getLocationId } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ReservationCard } from "@/components/ReservationCard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { LocationDetectionPopup } from "@/components/LocationDetectionPopup";
import { PaginationFilter } from "@/components/PaginationFilter";
import { useLocationDetection } from "@/hooks/useLocationDetection";
const qikpodLogo = "https://leapmile-website.blr1.cdn.digitaloceanspaces.com/Qikpod/Images/q70.png";
export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getUserData();
  const [dropPendingReservations, setDropPendingReservations] = useState<APIReservation[]>([]);
  const [pickupPendingReservations, setPickupPendingReservations] = useState<APIReservation[]>([]);
  const [historyReservations, setHistoryReservations] = useState<APIReservation[]>([]);
  const [historyFilter, setHistoryFilter] = useState<"PickupCompleted" | "DropCancelled">("PickupCompleted");
  const [loading, setLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("drop-pending");

  // Pagination states
  const [dropPendingPage, setDropPendingPage] = useState(1);
  const [pickupPendingPage, setPickupPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Location detection.
  const currentLocationId = localStorage.getItem("current_location_id");
  const { showLocationPopup, closeLocationPopup } = useLocationDetection(user?.id, currentLocationId);
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    if (user?.user_type !== "Customer") {
      navigate("/login");
      return;
    }
    initializeData();
  }, [navigate]); // Removed user from dependencies to prevent infinite calls

  const initializeData = async () => {
    const podName = getPodName();
    if (podName) {
      try {
        // First get pod info to extract location_id
        await apiService.getPodInfo(podName);

        // Then get location info to extract location name
        const locationId = getLocationId();
        if (locationId) {
          await apiService.getLocationInfo(locationId);
        }

        // Finally load reservations
        loadReservations();
      } catch (error) {
        console.error("Error initializing data:", error);
        toast({
          title: "Error",
          description: "Failed to load initial data",
          variant: "destructive",
        });
      }
    } else {
      loadReservations();
    }
  };
  const loadReservations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const locationId = localStorage.getItem("current_location_id");

      // Only proceed if we have a valid location_id
      if (!locationId) {
        console.log("No location_id found, skipping reservations load");
        setDropPendingReservations([]);
        setPickupPendingReservations([]);
        setHistoryReservations([]);
        return;
      }

      // Load all reservation types
      const [dropPending, pickupPending, pickupCompleted, dropCancelled] = await Promise.all([
        apiService.getReservations(user.user_phone, locationId, "DropPending"),
        apiService.getReservations(user.user_phone, locationId, "PickupPending"),
        apiService.getReservations(user.user_phone, locationId, "PickupCompleted"),
        apiService.getReservations(user.user_phone, locationId, "DropCancelled"),
      ]);
      setDropPendingReservations(dropPending);
      setPickupPendingReservations(pickupPending);

      // Set initial history based on current filter
      setHistoryReservations(historyFilter === "PickupCompleted" ? pickupCompleted : dropCancelled);
    } catch (error) {
      console.error("Error loading reservations:", error);
      // Don't show toast for API errors - let the empty state handle it
    } finally {
      setLoading(false);
    }
  };
  const handleHistoryFilterChange = async (filter: "PickupCompleted" | "DropCancelled") => {
    setHistoryFilter(filter);
    if (!user) return;
    try {
      const locationId = localStorage.getItem("current_location_id");

      // Only proceed if we have a valid location_id
      if (!locationId) {
        console.log("No location_id found, skipping history load");
        setHistoryReservations([]);
        return;
      }
      const reservations = await apiService.getReservations(user.user_phone, locationId, filter);
      setHistoryReservations(reservations);
    } catch (error) {
      console.error("Error loading history:", error);
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
    }
  };
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };
  const handleCreateReservation = async () => {
    const locationId = getLocationId();
    if (!locationId) {
      toast({
        title: "Error",
        description: "No location selected. Please select a location first.",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const freeDoorData = await apiService.checkFreeDoor(locationId);
      if (freeDoorData && freeDoorData.records && freeDoorData.records.length > 0) {
        const podId = freeDoorData.records[0].pod_id;
        navigate(`/reservation?pod_id=${podId}`);
      } else {
        toast({
          title: "No doors available",
          description: "No doors available at this location.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking door availability:", error);
      toast({
        title: "No doors available",
        description: "No doors available.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleShowMoreReservation = (reservation: APIReservation) => {
    navigate(`/reservation-details/${reservation.id}`);
  };
  const renderReservationCard = (reservation: APIReservation) => {
    return (
      <ReservationCard
        key={reservation.id}
        reservation={reservation as any}
        onShowMore={() => handleShowMoreReservation(reservation)}
      />
    );
  };

  // Pagination helpers
  const paginateReservations = (reservations: APIReservation[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return reservations.slice(startIndex, endIndex);
  };
  const getTotalPages = (reservations: APIReservation[]) => {
    return Math.ceil(reservations.length / itemsPerPage);
  };
  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {Array.from(
            {
              length: totalPages,
            },
            (_, i) => i + 1,
          ).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={page === currentPage}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "DropPending":
      case "PickupPending":
        return "default";
      case "PickupCompleted":
        return "secondary";
      case "DropCancelled":
        return "destructive";
      default:
        return "outline";
    }
  };
  const currentLocationName = localStorage.getItem("current_location_name");

  return (
    <div className="min-h-screen bg-background">
      {/* Location Name Banner */}
      {currentLocationName && (
        <div className="bg-primary/10 border-b border-primary/20 py-2 px-4">
          <div className="max-w-md mx-auto flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-800 opacity-40" />
            <span className="text-sm font-medium text-foreground">{currentLocationName}</span>
          </div>
        </div>
      )}

      {/* Create Reservation Button */}
      <div className="py-4 max-w-md mx-auto px-[14px]">
        <Button onClick={handleCreateReservation} className="btn-primary w-full h-12 text-base font-semibold">
          Create Reservation
        </Button>
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto px-[14px]">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="drop-pending">Drop Pending</TabsTrigger>
            <TabsTrigger value="pickup-pending">Pickup Pending</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Search and Filter Bar */}
          <div className="mt-4 mb-6">
            <PaginationFilter
              itemsPerPage={itemsPerPage}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                // Reset all pages to 1 when changing items per page
                setDropPendingPage(1);
                setPickupPendingPage(1);
                setHistoryPage(1);
              }}
              currentPage={1}
              totalPages={1}
              onPageChange={() => {}}
              totalItems={0}
              placeholder="Search reservations..."
            />
          </div>

          <TabsContent value="drop-pending" className="space-y-4 mt-6">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : dropPendingReservations.length > 0 ? (
              <>
                <div className="space-y-4">
                  {paginateReservations(dropPendingReservations, dropPendingPage).map(renderReservationCard)}
                </div>
                {renderPagination(dropPendingPage, getTotalPages(dropPendingReservations), setDropPendingPage)}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-5 h-5 text-gray-800 opacity-40" />
                <p className="text-lg font-medium mb-2">No Reservations</p>
                <p className="text-sm">There is No Reservation, Please Create Reservation</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pickup-pending" className="space-y-4 mt-6">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : pickupPendingReservations.length > 0 ? (
              <>
                <div className="space-y-4">
                  {paginateReservations(pickupPendingReservations, pickupPendingPage).map(renderReservationCard)}
                </div>
                {renderPagination(pickupPendingPage, getTotalPages(pickupPendingReservations), setPickupPendingPage)}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Reservations</p>
                <p className="text-sm">There is No Reservation, Please Create Reservation</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                variant={historyFilter === "PickupCompleted" ? "default" : "outline"}
                className="h-12 text-sm"
                onClick={() => handleHistoryFilterChange("PickupCompleted")}
              >
                Pickup Completed
              </Button>
              <Button
                variant={historyFilter === "DropCancelled" ? "default" : "outline"}
                className="h-12 text-sm"
                onClick={() => handleHistoryFilterChange("DropCancelled")}
              >
                Drop Cancelled
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : historyReservations.length > 0 ? (
              <>
                <div className="space-y-4">
                  {paginateReservations(historyReservations, historyPage).map(renderReservationCard)}
                </div>
                {renderPagination(historyPage, getTotalPages(historyReservations), setHistoryPage)}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-5 h-5 text-gray-800 opacity-40" />
                <p className="text-lg font-medium mb-2">No Reservations</p>
                <p className="text-sm">There is No Reservation, Please Create Reservation</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Are you sure you want to logout?</DialogTitle>
            <DialogDescription>You will need to sign in again to access your account.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleLogout} className="flex-1 btn-primary">
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
