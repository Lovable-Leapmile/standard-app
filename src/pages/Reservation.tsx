import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Clock } from "lucide-react";
import { getUserData, getPodValue, getLocationName, isLoggedIn } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
export default function Reservation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const loggedInUser = getUserData();
  const podValue = getPodValue();
  const currentLocationId = localStorage.getItem("current_location_id");
  const podId = searchParams.get("pod_id");

  // State for the user whose reservation we're creating (could be admin or customer)
  const [reservationUser, setReservationUser] = useState(loggedInUser);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [locationName, setLocationName] = useState("Unknown Location");
  const [formData, setFormData] = useState({
    awbNumber: "",
    executivePhone: loggedInUser?.user_phone || "",
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    // Check if we're creating a reservation for a specific customer
    const userId = searchParams.get("user_id");
    if (userId) {
      loadCustomerData(userId);
    }

    // Load location info if we have location_id
    if (currentLocationId) {
      loadLocationInfo();
    }
  }, [navigate, searchParams, currentLocationId]);
  const loadCustomerData = async (userId: string) => {
    setIsLoadingCustomer(true);
    try {
      const customerData = await apiService.getUserById(userId);
      if (customerData) {
        setReservationUser(customerData);
      }
    } catch (error) {
      console.error("Error loading customer data:", error);
      toast({
        title: "Error",
        description: "Failed to load customer data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const loadLocationInfo = async () => {
    if (!currentLocationId) return;

    try {
      const locationInfo = await apiService.getLocationInfo(currentLocationId);
      setLocationName(locationInfo.location_name || "Unknown Location");
    } catch (error) {
      console.error("Error loading location info:", error);
      setLocationName("Unknown Location");
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.awbNumber || !formData.executivePhone) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (!reservationUser || !loggedInUser) {
      toast({
        title: "Error",
        description: "User information not found.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      if (!podId) {
        toast({
          title: "Error",
          description: "Pod information is missing. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const reservationData = {
        created_by_phone: loggedInUser.user_phone,
        drop_by_phone: formData.executivePhone,
        pickup_by_phone: reservationUser.user_phone,
        pod_id: podId,
        reservation_awbno: formData.awbNumber,
      };
      const response = await apiService.createReservation(reservationData);
      toast({
        title: "Reservation Created",
        description: "Your reservation has been created successfully.",
      });
      navigate(`/reservation-details/${response.reservation_id}`);
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create reservation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <div className="mobile-container space-y-6">
        {/* User & Location Info */}
        <Card className="card-3d bg-gradient-primary p-6 text-qikpod-black animate-fade-in">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-800 opacity-40" />
                <h2 className="text-lg font-bold">{locationName}</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-4">
              <div>
                <p className="text-sm font-medium">User Name</p>
                <p className="text-base">{isLoadingCustomer ? "Loading..." : reservationUser?.user_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Phone Number</p>
                <p className="text-base">
                  {isLoadingCustomer 
                    ? "Loading..." 
                    : reservationUser?.user_phone 
                      ? loggedInUser?.user_type === "SiteSecurity"
                        ? `******${reservationUser.user_phone.slice(-4)}`
                        : reservationUser.user_phone
                      : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Flat Number</p>
                <p className="text-base">{isLoadingCustomer ? "Loading..." : reservationUser?.user_flatno || "N/A"}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Reservation Form */}
        <Card className="card-3d bg-card/80 backdrop-blur-sm p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-foreground mb-6">Package Details</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Enter AWB No. / Product Details *
              </label>
              <Input
                value={formData.awbNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    awbNumber: e.target.value,
                  }))
                }
                placeholder="Enter AWB number or product details"
                className="h-12"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Enter the Delivery Executive Phone Number *
              </label>
              <Input
                value={formData.executivePhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData((prev) => ({
                    ...prev,
                    executivePhone: value,
                  }));
                }}
                placeholder="Enter delivery executive phone number"
                type="tel"
                className="h-12"
                maxLength={10}
              />
            </div>

            <Button type="submit" disabled={loading} className="btn-qikpod w-full h-12">
              {loading ? "Processing..." : "Proceed"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
