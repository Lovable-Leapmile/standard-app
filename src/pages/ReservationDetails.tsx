import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Package, Clock, ArrowLeft, MapPin, Phone, Calendar, User, RotateCcw, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getUserData, isLoggedIn } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
interface ReservationDetail {
  id: string;
  pod_name: string;
  pod_status: string;
  location_name: string;
  drop_otp: string;
  pickup_otp: string;
  reservation_status: string;
  reservation_awbno: string;
  user_flatno: string;
  drop_by_phone: string;
  pickup_by_phone: string;
  drop_time: string;
  pickup_time: string;
  created_at: string;
  pickup_duration: string;
}
export default function ReservationDetails() {
  const navigate = useNavigate();
  const { reservationId } = useParams();
  const { toast } = useToast();
  const user = getUserData();
  const [reservationDetails, setReservationDetails] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    if (!reservationId) {
      toast({
        title: "Error",
        description: "Reservation ID not found.",
        variant: "destructive",
      });
      navigate("/customer-dashboard");
      return;
    }
    loadReservationDetails();
  }, [navigate, reservationId]);
  const loadReservationDetails = async () => {
    if (!reservationId) return;
    try {
      setLoading(true);
      const details = await apiService.getReservationDetails(reservationId);
      setReservationDetails(details);
    } catch (error: any) {
      console.error("Error loading reservation details:", error);
      toast({
        title: "Error",
        description: "Failed to load reservation details.",
        variant: "destructive",
      });
      navigate("/customer-dashboard");
    } finally {
      setLoading(false);
    }
  };
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };
  const getOTPDisplay = (otpType: "drop" | "pickup") => {
    if (!reservationDetails) return "*****";
    const status = reservationDetails.reservation_status;
    if (otpType === "drop") {
      return status === "DropPending" ? reservationDetails.drop_otp || "*****" : "*****";
    } else {
      return status === "PickupPending" ? reservationDetails.pickup_otp || "*****" : "*****";
    }
  };
  const handleResendDropOTP = async () => {
    if (!reservationId || !reservationDetails) return;
    setActionLoading(true);
    try {
      await apiService.resendDropOTP(reservationId);
      toast({
        title: "Success",
        description: "Drop OTP has been resent successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error resending drop OTP:", error);
      toast({
        title: "Error",
        description: "Failed to resend drop OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };
  const handleCancelReservation = async () => {
    if (!reservationId || !reservationDetails) return;
    setShowCancelDialog(false);
    setActionLoading(true);
    try {
      await apiService.cancelReservation(reservationId);
      toast({
        title: "Success",
        description: "Reservation has been cancelled successfully.",
        variant: "default",
      });
      // Refresh reservation details or navigate back
      setTimeout(() => {
        navigate("/customer-dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Error cancelling reservation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel reservation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };
  const canResendDropOTP = reservationDetails?.reservation_status === "DropPending";
  const canCancelReservation =
    reservationDetails?.reservation_status === "DropPending" ||
    reservationDetails?.reservation_status === "PickupPending";
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mobile-container">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading reservation details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!reservationDetails) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mobile-container">
          <div className="text-center py-20">
            <p className="text-muted-foreground">Reservation details not found.</p>
            <Button onClick={() => navigate("/customer-dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="mobile-container space-y-6">
        {/* Header Card */}
        <Card className="card-3d bg-gradient-primary p-6 text-qikpod-black animate-fade-in">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/customer-dashboard")}
              className="h-8 w-8 p-0 text-qikpod-black hover:bg-black/10 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 opacity-30" />
              <div>
                <h2 className="text-lg font-bold">{reservationDetails.pod_name}</h2>
              </div>
            </div>
          </div>
        </Card>

        {/* Location & Basic Info */}
        <Card className="card-3d bg-card/80 backdrop-blur-sm p-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary" />
            Location & Details
            <p className="text-base text-foreground">{reservationDetails.location_name || "N/A"}</p>
          </h3>
          <div className="space-y-4">
            {/* OTP Section - Enhanced Styling */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-4 mb-4">
              <div className="text-center mb-3">
                <h4 className="text-sm font-semibold text-black mb-1">🔐 Access Codes</h4>
                <p className="text-xs text-muted-foreground">Use these OTPs when prompted</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-background/50 border">
                  <p className="text-xs font-medium text-black mb-1">Drop OTP</p>
                  <p className="text-lg font-mono font-bold tracking-wider text-black">{getOTPDisplay("drop")}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50 border">
                  <p className="text-xs font-medium text-black mb-1">Pickup OTP</p>
                  <p className="text-lg font-mono font-bold tracking-wider text-black">{getOTPDisplay("pickup")}</p>
                </div>
              </div>
            </Card>

            {/* AWB Number and Flat Number - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AWB Number</p>
                <p className="text-base text-foreground">{reservationDetails.reservation_awbno || "N/A"}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Flat Number</p>
                <p className="text-base text-foreground">
                  {reservationDetails.user_flatno || user?.user_flatno || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Details */}
        <Card className="card-3d bg-card/80 backdrop-blur-sm p-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-primary" />
            Contact Information
          </h3>

          {/* Drop by Phone and Pickup by Phone - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Drop by Phone</p>
              <p className="text-base text-foreground">{reservationDetails.drop_by_phone || "N/A"}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Pickup by Phone</p>
              <p className="text-base text-foreground">{reservationDetails.pickup_by_phone || "N/A"}</p>
            </div>
          </div>
        </Card>

        {/* Timing Details */}
        <Card className="card-3d bg-card/80 backdrop-blur-sm p-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Timing Information
          </h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-base text-foreground">{formatDateTime(reservationDetails.created_at)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Drop Time</p>
              <p className="text-base text-foreground">{formatDateTime(reservationDetails.drop_time)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Pickup Time</p>
              <p className="text-base text-foreground">{formatDateTime(reservationDetails.pickup_time)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Pickup Duration</p>
              <p className="text-base text-foreground">{reservationDetails.pickup_duration || "N/A"}</p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          {/* Re-send Drop OTP Button */}
          <Button
            onClick={handleResendDropOTP}
            disabled={!canResendDropOTP || actionLoading}
            variant="outline"
            className="w-full h-12 flex items-center justify-center space-x-2"
          >
            <RotateCcw className={`w-4 h-4 ${actionLoading ? "animate-spin" : ""}`} />
            <span>Re-send Drop OTP</span>
          </Button>

          {/* Cancel Reservation Button */}
          <Button
            onClick={() => setShowCancelDialog(true)}
            disabled={!canCancelReservation || actionLoading}
            variant="destructive"
            className="w-full h-12 flex items-center justify-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel Reservation</span>
          </Button>

          <Button onClick={() => navigate("/customer-dashboard")} className="btn-qikpod w-full h-12">
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelReservation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel Reservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
