import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Calendar, Phone, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserData, isLoggedIn } from "@/utils/storage";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { LocationDetectionPopup } from "@/components/LocationDetectionPopup";
import { useLocationDetection } from "@/hooks/useLocationDetection";
import { PaginationFilter } from "@/components/PaginationFilter";

interface RTOReservation {
  id: string;
  user_name: string;
  user_phone: string;
  awb_number: string;
  reservation_status: string;
  created_at: string;
  updated_at: string;
  drop_otp: string;
  pickup_otp: string;
  rto_otp?: string;
  pod_name?: string;
  location_name?: string;
  rto_picktime?: string;
}

type TabType = 'pending' | 'completed';

export default function RTO() {
  const navigate = useNavigate();
  const user = getUserData();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingReservations, setPendingReservations] = useState<RTOReservation[]>([]);
  const [completedReservations, setCompletedReservations] = useState<RTOReservation[]>([]);
  const [filteredPendingReservations, setFilteredPendingReservations] = useState<RTOReservation[]>([]);
  const [filteredCompletedReservations, setFilteredCompletedReservations] = useState<RTOReservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  // Location detection
  const currentLocationId = localStorage.getItem('current_location_id');
  const { showLocationPopup, closeLocationPopup } = useLocationDetection(user?.id, currentLocationId);

  // Authentication and authorization check
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    // Only allow SiteAdmin access
    if (user?.user_type !== 'SiteAdmin') {
      navigate('/login');
      toast.error('Access denied. Only Site Admin can access this page.');
      return;
    }

    // Only set authorized if user is logged in AND is SiteAdmin
    setIsAuthorized(true);
  }, [navigate, user]);

  // Load reservations function - only if authorized
  const loadRTOReservations = useCallback(async (tab: TabType) => {
    if (!currentLocationId || !isAuthorized) {
      return;
    }

    setIsLoading(true);
    try {
      const status = tab === 'pending' ? 'RTOPending' : 'RTOCompleted';
      console.log(`Fetching RTO ${tab} reservations with status:`, status);

      const response = await apiService.getLocationReservations(currentLocationId, status);
      console.log(`RTO ${tab} API response:`, response);
      setApiResponse(response); // Store for debugging

      // Handle different response formats
      let reservationsArray: RTOReservation[] = [];

      if (Array.isArray(response)) {
        // Direct array response
        reservationsArray = response;
      } else if (response && typeof response === 'object') {
        // Check common response structures
        if (Array.isArray((response as any).data)) {
          reservationsArray = (response as any).data;
        } else if (Array.isArray((response as any).reservations)) {
          reservationsArray = (response as any).reservations;
        } else if (Array.isArray((response as any).items)) {
          reservationsArray = (response as any).items;
        } else if (Array.isArray((response as any).result)) {
          reservationsArray = (response as any).result;
        } else if ((response as any).reservations && Array.isArray((response as any).reservations.data)) {
          reservationsArray = (response as any).reservations.data;
        } else {
          // Try to find any array in the response object
          const arrayKey = Object.keys(response).find(key => Array.isArray((response as any)[key]));
          if (arrayKey) {
            reservationsArray = (response as any)[arrayKey];
          } else {
            // If no array found, try to extract values that might be objects
            const values = Object.values(response);
            const arrayValues = values.filter(value => Array.isArray(value));
            if (arrayValues.length > 0) {
              reservationsArray = arrayValues[0];
            }
          }
        }
      }

      console.log(`Processed RTO ${tab} reservations:`, reservationsArray);

      // Transform data if needed - ensure it matches RTOReservation interface
      const transformedReservations = reservationsArray.map((item: any) => ({
        id: item.id || item.reservation_id || item._id || '',
        user_name: item.user_name || item.customer_name || item.name || 'Unknown User',
        user_phone: item.user_phone || item.customer_phone || item.phone || '',
        awb_number: item.awb_number || item.tracking_number || item.awb || '',
        reservation_status: item.reservation_status || item.status || '',
        created_at: item.created_at || item.created_date || item.date_created || '',
        updated_at: item.updated_at || item.modified_date || '',
        drop_otp: item.drop_otp || item.delivery_otp || '',
        pickup_otp: item.pickup_otp || item.collection_otp || '',
        rto_otp: item.rto_otp || item.return_otp || '',
        pod_name: item.pod_name || item.hub_name || '',
        location_name: item.location_name || item.site_name || '',
        rto_picktime: item.rto_picktime || item.return_date || item.completed_at || ''
      }));

      console.log(`Transformed RTO ${tab} reservations:`, transformedReservations);

      if (tab === 'pending') {
        setPendingReservations(transformedReservations);
        setFilteredPendingReservations(transformedReservations);
      } else {
        setCompletedReservations(transformedReservations);
        setFilteredCompletedReservations(transformedReservations);
      }
    } catch (error: any) {
      console.error(`Error loading RTO ${tab} reservations:`, error);
      toast.error(`Failed to load RTO ${tab} reservations: ${error.message || 'Unknown error'}`);

      if (tab === 'pending') {
        setPendingReservations([]);
        setFilteredPendingReservations([]);
      } else {
        setCompletedReservations([]);
        setFilteredCompletedReservations([]);
      }
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
      loadRTOReservationsRef.current(activeTab);
    }
  }, [currentLocationId, activeTab, isAuthorized]);

  // Filter reservations based on search
  useEffect(() => {
    if (!isAuthorized) return;

    const reservations = activeTab === 'pending' ? pendingReservations : completedReservations;
    const filtered = reservations.filter(reservation =>
      reservation.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.user_phone?.includes(searchQuery) ||
      reservation.awb_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTab === 'pending') {
      setFilteredPendingReservations(filtered);
    } else {
      setFilteredCompletedReservations(filtered);
    }
    setCurrentPage(1);
  }, [pendingReservations, completedReservations, searchQuery, activeTab, isAuthorized]);

  const handleReservationClick = (reservation: RTOReservation) => {
    if (!isAuthorized) return;
    navigate(`/reservation-details/${reservation.id}`);
  };

  const handleTabChange = (value: string) => {
    if (!isAuthorized) return;
    const newTab = value as TabType;
    setActiveTab(newTab);
    setSearchQuery("");
    setCurrentPage(1);

    // Load data for the new tab
    if (currentLocationId && isAuthorized) {
      loadRTOReservations(newTab);
    }
  };

  const handleRefresh = () => {
    if (!isAuthorized) return;
    loadRTOReservations(activeTab);
  };

  // Get current items for pagination
  const currentReservations = activeTab === 'pending' ? filteredPendingReservations : filteredCompletedReservations;
  const totalItems = currentReservations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = currentReservations.slice(startIndex, endIndex);

  const renderReservationCard = (reservation: RTOReservation) => (
    <Card
      key={reservation.id}
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleReservationClick(reservation)}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            activeTab === 'pending'
              ? 'bg-orange-100'
              : 'bg-green-100'
          }`}>
            {activeTab === 'pending' ? (
              <Clock className="w-5 h-5 text-orange-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
        <div className="space-y-2 text-sm">
          {activeTab === 'completed' && reservation.rto_picktime && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Completed: {new Date(reservation.rto_picktime).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* OTP Section */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-3 rounded-lg">
          <div className="text-center mb-2">
            <h4 className="text-xs font-semibold text-primary mb-1">🔐 OTP Codes</h4>
          </div>
          <div className={`grid gap-3 ${activeTab === 'pending' ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <div className="text-center p-2 rounded bg-background/50 border">
                <p className="text-xs text-muted-foreground mb-1">RTO</p>
                <p className="text-sm font-mono font-bold text-primary">{reservation.rto_otp || '*****'}</p>
              </div>
            {activeTab === 'completed' && (
              <div className="text-center p-2 rounded bg-background/50 border">
                <p className="text-xs text-muted-foreground mb-1">RTO</p>
                <p className="text-sm font-mono font-bold text-primary">'*****'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/site-admin-dashboard')}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Return to Origin (RTO)
              </h1>
              <p className="text-muted-foreground">Manage return to origin reservations</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Location Warning */}
        {!currentLocationId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ No location selected. Please select a location to view RTO reservations.
            </p>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
          <p><strong>Debug Information:</strong></p>
          <p>Current Location ID: {currentLocationId || 'Not set'}</p>
          <p>Pending Reservations: {pendingReservations.length}</p>
          <p>Completed Reservations: {completedReservations.length}</p>
          <p>Active Tab: {activeTab}</p>
          <p>API Response Type: {apiResponse ? typeof apiResponse : 'No response yet'}</p>
          {apiResponse && Array.isArray(apiResponse) && (
            <p>API Response Array Length: {apiResponse.length}</p>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              RTO Pending ({pendingReservations.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              RTO Completed ({completedReservations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            {/* Pagination Filter */}
            <PaginationFilter
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              placeholder="Search pending reservations by name, phone, or AWB number..."
            />

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
            ) : currentItems.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No reservations found matching your search." : "No RTO pending reservations found."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentItems.map(renderReservationCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {/* Pagination Filter */}
            <PaginationFilter
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              placeholder="Search completed reservations by name, phone, or AWB number..."
            />

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
                  <p className="text-muted-foreground">Loading RTO completed reservations...</p>
                </div>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No reservations found matching your search." : "No RTO completed reservations found."}
                </p>
                {completedReservations.length > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    Note: There are {completedReservations.length} completed reservations but they don't match your search.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentItems.map(renderReservationCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
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