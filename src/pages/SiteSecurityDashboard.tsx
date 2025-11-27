import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Plus, User, Phone, Mail, Home, Package, AlertCircle, MapPin } from "lucide-react";
import { PaginationFilter } from "@/components/PaginationFilter";
import { getUserData, isLoggedIn } from "@/utils/storage";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { LocationDetectionPopup } from "@/components/LocationDetectionPopup";
import { useLocationDetection } from "@/hooks/useLocationDetection";
import { maskPhoneNumber } from "@/utils/phoneUtils";

interface LocationUser {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_flatno: string;
  user_address: string;
  user_type: string;
}

interface Reservation {
  id: string;
  user_name: string;
  user_phone: string;
  awb_number: string;
  reservation_status: string;
  created_at: string;
  updated_at: string;
  pod_name?: string;
  location_name?: string;
}

interface NewUserForm {
  user_name: string;
  user_email: string;
  user_phone: string;
  user_address: string;
  user_flatno: string;
}

export default function SiteSecurityDashboard() {
  const navigate = useNavigate();
  const user = getUserData();
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs state
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showCreateReservationDialog, setShowCreateReservationDialog] = useState(false);
  const [showUserSelectionDialog, setShowUserSelectionDialog] = useState(false);
  const [showConfirmUserDialog, setShowConfirmUserDialog] = useState(false);

  // Data state
  const [locationUsers, setLocationUsers] = useState<LocationUser[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedUser, setSelectedUser] = useState<LocationUser | null>(null);
  const [reservationSubTab, setReservationSubTab] = useState("pickup-pending");
  const [historySubTab, setHistorySubTab] = useState("drop-cancelled");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    user_name: "",
    user_email: "",
    user_phone: "",
    user_address: "",
    user_flatno: ""
  });

  // Location detection
  const currentLocationId = localStorage.getItem('current_location_id');
  const { showLocationPopup, closeLocationPopup } = useLocationDetection(user?.id, currentLocationId);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    if (user?.user_type !== 'SiteSecurity') {
      navigate('/login');
      return;
    }

    // Reset error state when loading new data
    setError(null);
  }, [navigate, user]);

  useEffect(() => {
    if (currentLocationId) {
      loadData();
    }
  }, [currentLocationId, activeTab, reservationSubTab, historySubTab]);

  const loadData = async () => {
    if (!currentLocationId) return;

    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === "users") {
        await loadLocationUsers();
      } else if (activeTab === "reservations") {
        await loadReservations();
      } else if (activeTab === "history") {
        await loadHistory();
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data. Please try again.");
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocationUsers = async () => {
    try {
      const users = await apiService.getLocationUsers(currentLocationId!);
      if (users && Array.isArray(users)) {
        setLocationUsers(users);
      } else {
        console.warn("Unexpected API response format for users:", users);
        setLocationUsers([]);
        setError("Received unexpected data format from server");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Failed to load users");
      toast.error("Failed to load users");
      setLocationUsers([]);
    }
  };

  const loadReservations = async () => {
    try {
      const status = reservationSubTab === "pickup-pending" ? "PickupPending" : "DropPending";
      console.log("Fetching reservations with status:", status);

      const reservationList = await apiService.getLocationReservations(currentLocationId!, status);
      console.log("API Response:", reservationList);

      if (reservationList && Array.isArray(reservationList)) {
        // Map the data to ensure proper field names
        const mappedReservations = reservationList.map(reservation => ({
          ...reservation,
          user_name: reservation.user_name || reservation.created_by_name || "Unknown User",
          awb_number: reservation.awb_number || reservation.reservation_awbno || "N/A",
          user_phone: reservation.user_phone || reservation.created_by_phone || "N/A"
        }));
        setReservations(mappedReservations);
        setError(null);
      } else {
        console.warn("Unexpected API response format for reservations:", reservationList);
        setReservations([]);
        setError("Received unexpected data format from server");
      }
    } catch (error) {
      console.error("Error loading reservations:", error);
      setError("Failed to load reservations");
      toast.error("Failed to load reservations");
      setReservations([]);
    }
  };

  const loadHistory = async () => {
    try {
      const status = historySubTab === "drop-cancelled" ? "DropCancelled" : "PickupCompleted";
      console.log("Fetching history with status:", status);

      const historyList = await apiService.getLocationReservations(currentLocationId!, status);
      console.log("API Response:", historyList);

      if (historyList && Array.isArray(historyList)) {
        // Map the data to ensure proper field names
        const mappedHistory = historyList.map(reservation => ({
          ...reservation,
          user_name: reservation.user_name || reservation.created_by_name || "Unknown User",
          awb_number: reservation.awb_number || reservation.reservation_awbno || "N/A",
          user_phone: reservation.user_phone || reservation.created_by_phone || "N/A"
        }));
        setReservations(mappedHistory);
        setError(null);
      } else {
        console.warn("Unexpected API response format for history:", historyList);
        setReservations([]);
        setError("Received unexpected data format from server");
      }
    } catch (error) {
      console.error("Error loading history:", error);
      setError("Failed to load history");
      toast.error("Failed to load history");
      setReservations([]);
    }
  };

  const handleAddUser = async () => {
    if (!currentLocationId) {
      toast.error("No location selected");
      return;
    }

    setIsLoading(true);
    try {
      // First create the user
      const response = await apiService.registerUser(newUserForm);
      const newUserId = response.id || response.user_id;

      // Then add the user to the current location
      if (newUserId) {
        await apiService.addUserToLocation(newUserId, currentLocationId);
      }

      toast.success("User added successfully!");
      setShowAddUserDialog(false);
      setNewUserForm({
        user_name: "",
        user_email: "",
        user_phone: "",
        user_address: "",
        user_flatno: ""
      });
      if (activeTab === "users") {
        await loadLocationUsers();
      }
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast.error(error?.message || "Failed to add user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUserForReservation = (selectedUser: LocationUser) => {
    setSelectedUser(selectedUser);
    setShowUserSelectionDialog(false);
    setShowConfirmUserDialog(true);
  };

  const handleOpenUserSelectionDialog = async () => {
    setShowUserSelectionDialog(true);
    // Load users when opening the dialog
    if (currentLocationId && locationUsers.length === 0) {
      await loadLocationUsers();
    }
  };

  const handleConfirmUserForReservation = async () => {
    if (!selectedUser || !currentLocationId) return;

    setIsLoading(true);
    try {
      // Check for free door first
      const freeDoorResponse = await apiService.checkFreeDoor(currentLocationId);
      
      if (!freeDoorResponse || !freeDoorResponse.records || freeDoorResponse.records.length === 0) {
        toast.error("No free doors available at this location");
        setIsLoading(false);
        return;
      }

      const podId = freeDoorResponse.records[0].pod_id;
      navigate(`/reservation?user_id=${selectedUser.user_id}&location_id=${currentLocationId}&pod_id=${podId}`);
    } catch (error) {
      console.error("Error checking free door:", error);
      toast.error("Failed to check door availability");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserCardClick = (clickedUser: LocationUser) => {
    navigate(`/profile?user_id=${clickedUser.user_id}&admin_view=true`);
  };

  const handleReservationCardClick = (reservation: Reservation) => {
    navigate(`/reservation-details/${reservation.id}`);
  };

  const filteredUsers = Array.isArray(locationUsers) ? locationUsers.filter(user =>
    user.user_type === "Customer" && (
      user.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_phone.includes(searchQuery) ||
      user.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_flatno.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) : [];

  const filteredReservations = Array.isArray(reservations) ? reservations.filter(reservation =>
    reservation.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reservation.user_phone.includes(searchQuery) ||
    reservation.awb_number.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Pagination calculations for users
  const totalUsers = filteredUsers.length;
  const totalUserPages = Math.ceil(totalUsers / itemsPerPage);
  const userStartIndex = (currentPage - 1) * itemsPerPage;
  const userEndIndex = userStartIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(userStartIndex, userEndIndex);

  // Pagination calculations for reservations
  const totalReservations = filteredReservations.length;
  const totalReservationPages = Math.ceil(totalReservations / itemsPerPage);
  const reservationStartIndex = (currentPage - 1) * itemsPerPage;
  const reservationEndIndex = reservationStartIndex + itemsPerPage;
  const currentReservations = filteredReservations.slice(reservationStartIndex, reservationEndIndex);

  if (!user) return null;

  // Reservation List Component with phone masking
  const ReservationList = ({ reservations, onReservationClick }: {
    reservations: Reservation[];
    onReservationClick: (reservation: Reservation) => void;
  }) => {
    if (reservations.length === 0) {
      return (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            {searchQuery ? "No reservations found matching your search." : "No reservations found."}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reservations.map((reservation) => (
          <Card
            key={reservation.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onReservationClick(reservation)}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-foreground">{reservation.user_name}</h3>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {reservation.reservation_status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  <span>{maskPhoneNumber(reservation.user_phone)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3" />
                  <span>AWB: {reservation.awb_number}</span>
                </div>
                {reservation.pod_name && (
                  <div className="flex items-center gap-2">
                    <Home className="w-3 h-3" />
                    <span>Pod: {reservation.pod_name}</span>
                  </div>
                )}
                <div className="text-xs">
                  Created: {new Date(reservation.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const currentLocationName = localStorage.getItem('current_location_name');

  return (
    <div className="min-h-screen bg-background">
      {/* Location Name Banner */}
      {currentLocationName && (
        <div className="bg-primary/10 border-b border-primary/20 py-2 px-4">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{currentLocationName}</span>
          </div>
        </div>
      )}

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Site Security Dashboard
          </h1>
          <p className="text-muted-foreground">Manage users, reservations, and location operations</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={loadData}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Top Action Buttons */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button
              onClick={() => setShowAddUserDialog(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenUserSelectionDialog}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Reservation
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Pagination Filter */}
          <div className="mt-4">
            <PaginationFilter
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              currentPage={currentPage}
              totalPages={
                activeTab === "users"
                  ? totalUserPages
                  : totalReservationPages
              }
              onPageChange={setCurrentPage}
              totalItems={
                activeTab === "users"
                  ? totalUsers
                  : totalReservations
              }
              placeholder={
                activeTab === "users"
                  ? "Search users by name, phone, email, or flat number..."
                  : "Search reservations by name, phone, or AWB number..."
              }
            />
          </div>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            {currentUsers.length === 0 ? (
              <div className="text-center py-20">
                <User className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No users found matching your search." : "No users found for this location."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentUsers.map((locationUser) => (
                  <Card
                    key={locationUser.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                    onClick={() => handleUserCardClick(locationUser)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{locationUser.user_name}</h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{locationUser.user_email || "No email"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span className="truncate">{maskPhoneNumber(locationUser.user_phone)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Home className="w-3 h-3 shrink-0" />
                              <span className="truncate">{locationUser.user_flatno || "No flat number"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-4">
            <Tabs value={reservationSubTab} onValueChange={setReservationSubTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pickup-pending">Pickup Pending</TabsTrigger>
                <TabsTrigger value="drop-pending">Drop Pending</TabsTrigger>
              </TabsList>

              <TabsContent value="pickup-pending" className="space-y-4">
                <ReservationList
                  reservations={currentReservations}
                  onReservationClick={handleReservationCardClick}
                />
              </TabsContent>

              <TabsContent value="drop-pending" className="space-y-4">
                <ReservationList
                  reservations={currentReservations}
                  onReservationClick={handleReservationCardClick}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Tabs value={historySubTab} onValueChange={setHistorySubTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="drop-cancelled">Drop Cancelled</TabsTrigger>
                <TabsTrigger value="pickup-completed">Pickup Completed</TabsTrigger>
              </TabsList>

              <TabsContent value="drop-cancelled" className="space-y-4">
                <ReservationList
                  reservations={currentReservations}
                  onReservationClick={handleReservationCardClick}
                />
              </TabsContent>

              <TabsContent value="pickup-completed" className="space-y-4">
                <ReservationList
                  reservations={currentReservations}
                  onReservationClick={handleReservationCardClick}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Add User Dialog */}
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new user to this location.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user_name">Full Name</Label>
                <Input
                  id="user_name"
                  value={newUserForm.user_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, user_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="user_email">Email</Label>
                <Input
                  id="user_email"
                  type="email"
                  value={newUserForm.user_email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, user_email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="user_phone">Phone Number</Label>
                <Input
                  id="user_phone"
                  value={newUserForm.user_phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, user_phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="user_flatno">Flat Number</Label>
                <Input
                  id="user_flatno"
                  value={newUserForm.user_flatno}
                  onChange={(e) => setNewUserForm({ ...newUserForm, user_flatno: e.target.value })}
                  placeholder="Enter flat number"
                />
              </div>
              <div>
                <Label htmlFor="user_address">Address</Label>
                <Textarea
                  id="user_address"
                  value={newUserForm.user_address}
                  onChange={(e) => setNewUserForm({ ...newUserForm, user_address: e.target.value })}
                  placeholder="Enter address"
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Selection Dialog */}
        <Dialog open={showUserSelectionDialog} onOpenChange={setShowUserSelectionDialog}>
          <DialogContent className="max-w-lg mx-auto max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Select User for Reservation</DialogTitle>
              <DialogDescription>
                Choose a user to create a reservation for.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Card
                    key={user.id}
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSelectUserForReservation(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{user.user_name}</h4>
                        <p className="text-sm text-muted-foreground truncate">{maskPhoneNumber(user.user_phone)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserSelectionDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm User Dialog */}
        <Dialog open={showConfirmUserDialog} onOpenChange={setShowConfirmUserDialog}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Confirm User Selection</DialogTitle>
              <DialogDescription>
                Create a reservation for the selected user?
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{selectedUser.user_name}</h4>
                    <p className="text-sm text-muted-foreground">{maskPhoneNumber(selectedUser.user_phone)}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmUserForReservation}>
                Create Reservation
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
    </div>
  );
}