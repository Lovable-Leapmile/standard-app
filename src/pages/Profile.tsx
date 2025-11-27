import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, Mail, MapPin, Home, Edit2, X, Check, RefreshCw, ArrowLeft, Trash2 } from "lucide-react";
import { getUserData, isLoggedIn, setUserData } from "@/utils/storage";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { maskPhoneNumber } from "@/utils/phoneUtils";

interface UserShape {
  id: number | string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_flatno?: string;
  user_address?: string;
  user_type?: string;
  user_credit_limit?: string | number;
  user_credit_used?: string | number;
  [key: string]: any;
}

interface ProfileForm {
  user_name: string;
  user_email: string;
  user_flatno: string;
  user_address: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("user_id");
  const isAdminView = searchParams.get("admin_view") === "true";
  const [user, setUser] = useState<UserShape | null>(() => getUserData());
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<ProfileForm>({
    user_name: "",
    user_email: "",
    user_flatno: "",
    user_address: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    // If viewing another user's profile (admin view), fetch that user's data
    if (userId && isAdminView) {
      fetchUserById(userId);
    }
  }, [navigate, userId, isAdminView]);

  const fetchUserById = async (id: string) => {
    setIsFetchingUser(true);
    try {
      const userData = await apiService.getUserById(id);
      if (userData) {
        setUser(userData);
      } else {
        toast.error("User not found");
        navigate(-1);
      }
    } catch (error: any) {
      console.error("Error fetching user:", error);
      toast.error(error?.message || "Failed to load user profile");
      navigate(-1);
    } finally {
      setIsFetchingUser(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        user_name: user.user_name || "",
        user_email: user.user_email || "",
        user_flatno: user.user_flatno || "",
        user_address: user.user_address || "",
      });
      setErrors({});
    }
  }, [user]);

  useEffect(() => {
    if (isEditing) {
      const t = setTimeout(() => firstInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

  if (!user) return null;

  const availableCredit = useMemo(() => {
    const limitNum = Number(user.user_credit_limit ?? 0);
    const usedNum = Number(user.user_credit_used ?? 0);
    const diff = isFinite(limitNum - usedNum) ? limitNum - usedNum : 0;
    return Math.max(0, Math.floor(diff));
  }, [user.user_credit_limit, user.user_credit_used]);

  const profileItems = [
    {
      icon: User,
      label: "Name",
      field: "user_name",
      value: user.user_name || "—",
      editable: true,
    },
    {
      icon: Phone,
      label: "Phone Number",
      field: "user_phone",
      value: user.user_phone
        ? isAdminView && getUserData()?.user_type === "SiteSecurity"
          ? maskPhoneNumber(user.user_phone)
          : user.user_phone
        : "—",
      editable: false,
    },
    {
      icon: Mail,
      label: "Email",
      field: "user_email",
      value: user.user_email || "Not provided",
      editable: true,
    },
    {
      icon: Home,
      label: "Flat Number",
      field: "user_flatno",
      value: user.user_flatno || "Not specified",
      editable: true,
    },
    {
      icon: MapPin,
      label: "Address",
      field: "user_address",
      value: user.user_address || "Not provided",
      editable: true,
    },
  ] as const;

  const clean = (s: string) => s.trim();
  const isValidEmail = (s: string) =>
    !s || /^(?:[a-zA-Z0-9_!#$%&'*+\/=?`{|}~^.-]+)@(?:[a-zA-Z0-9.-]+)\.[a-zA-Z]{2,}$/.test(s);

  const original: ProfileForm = useMemo(
    () => ({
      user_name: user.user_name || "",
      user_email: user.user_email || "",
      user_flatno: user.user_flatno || "",
      user_address: user.user_address || "",
    }),
    [user],
  );

  const hasChanges = useMemo(() => {
    return (
      clean(formData.user_name) !== clean(original.user_name) ||
      clean(formData.user_email) !== clean(original.user_email) ||
      clean(formData.user_flatno) !== clean(original.user_flatno) ||
      clean(formData.user_address) !== clean(original.user_address)
    );
  }, [formData, original]);

  const validate = (draft: ProfileForm) => {
    const nextErrors: Partial<Record<keyof ProfileForm, string>> = {};
    if (!clean(draft.user_name)) nextErrors.user_name = "Name is required";
    if (!isValidEmail(clean(draft.user_email))) nextErrors.user_email = "Enter a valid email";
    return nextErrors;
  };

  const handleSave = async () => {
    const payload: ProfileForm = {
      user_name: clean(formData.user_name),
      user_email: clean(formData.user_email),
      user_flatno: clean(formData.user_flatno),
      user_address: clean(formData.user_address),
    };

    const nextErrors = validate(payload);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    if (!hasChanges) {
      toast.info("No changes to save.");
      return;
    }

    setIsLoading(true);
    try {
      await apiService.updateUser(Number(user.id), payload);
      const updatedUser: UserShape = {
        ...user,
        ...payload,
      };
      setUser(updatedUser);
      setUserData(updatedUser as any);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmClose = window.confirm("Discard your unsaved changes?");
      if (!confirmClose) return;
    }
    setFormData(original);
    setErrors({});
    setIsEditing(false);
  };

  const handleResetToOriginal = () => {
    setFormData(original);
    setErrors({});
  };

  const handleDeleteUser = async () => {
    if (!user?.id) return;

    const currentLocationId = localStorage.getItem("current_location_id");
    if (!currentLocationId) {
      toast.error("Location information not found");
      return;
    }

    setIsLoading(true);
    try {
      // First get the user-location mapping ID
      const mapping = await apiService.getUserLocationMapping(Number(user.id), currentLocationId);
      if (!mapping || !mapping.id) {
        toast.error("User-location mapping not found");
        return;
      }

      // Then remove the user from location using the mapping ID
      await apiService.removeUserFromLocation(mapping.id);
      toast.success("User removed from location successfully!");
      setShowDeleteDialog(false);
      navigate(-1);
    } catch (error: any) {
      console.error("Error removing user from location:", error);
      toast.error(error?.message || "Failed to remove user from location");
    } finally {
      setIsLoading(false);
    }
  };

  const currentUser = getUserData();
  const canDeleteUser = isAdminView && currentUser?.user_type === "SiteAdmin";

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing && hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isEditing, hasChanges]);

  if (isFetchingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Profile Header Card with Back Button */}
        <Card className="card-modern bg-gradient-primary p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-8 w-8 p-0 bg-white/20 text-gray-800 hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-foreground mt-2 mb-4 h-4">Personal Information</h2>
            </div>
            {!isAdminView && (
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="bg-white/20 hover:bg-white/30 border-0 text-gray-800"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* Profile Details */}
        <div className="bg-secondary rounded-xl p-4">
          <div className="space-y-3">
            {profileItems.map((item) => (
              <Card key={item.label} className="card-modern p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-gray-800 opacity-40" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">{item.label}</Label>
                    <p className="font-medium text-foreground mt-1">{item.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Remove User Button - Only for Site Admin */}
        {canDeleteUser && (
          <Card className="p-4 border-destructive/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-destructive">Remove the User from this Location</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove User
              </Button>
            </div>
          </Card>
        )}

        {/* Edit Dialog - only show if not admin view */}
        {isEditing && !isAdminView && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6 mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Edit Profile</h2>
                <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="mb-2">
                    Name
                  </Label>
                  <Input
                    id="name"
                    ref={firstInputRef}
                    value={formData.user_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        user_name: e.target.value,
                      }))
                    }
                    placeholder="Enter your name"
                    disabled={isLoading}
                    aria-invalid={!!errors.user_name}
                    aria-describedby={errors.user_name ? "name-error" : undefined}
                  />
                  {errors.user_name && (
                    <p id="name-error" className="mt-1 text-sm text-red-600">
                      {errors.user_name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="mb-2">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.user_email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        user_email: e.target.value,
                      }))
                    }
                    placeholder="Enter your email"
                    disabled={isLoading}
                    aria-invalid={!!errors.user_email}
                    aria-describedby={errors.user_email ? "email-error" : undefined}
                  />
                  {errors.user_email && (
                    <p id="email-error" className="mt-1 text-sm text-red-600">
                      {errors.user_email}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="flatno" className="mb-2">
                    Flat Number
                  </Label>
                  <Input
                    id="flatno"
                    value={formData.user_flatno}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        user_flatno: e.target.value,
                      }))
                    }
                    placeholder="Enter your flat number"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="mb-2">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.user_address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        user_address: e.target.value,
                      }))
                    }
                    placeholder="Enter your address"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="mb-2">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={
                      user.user_phone
                        ? isAdminView && getUserData()?.user_type === "SiteSecurity"
                          ? maskPhoneNumber(user.user_phone)
                          : user.user_phone
                        : "—"
                    }
                    readOnly
                    disabled
                  />
                </div>
              </div>

              {/* Responsive button container */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !hasChanges}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetToOriginal}
                  disabled={isLoading || !hasChanges}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Reset
                </Button>
                <Button variant="secondary" onClick={handleCancel} disabled={isLoading} className="flex-1">
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Remove User Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove User from Location</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {user.user_name} from this location? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
