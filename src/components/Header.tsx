import { useMemo, useState } from "react";
import { User, MapPin, HelpCircle, LogOut, Menu, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { clearUserData, clearPodValue } from "@/utils/storage";
import { getUserData } from "@/utils/storage";

interface HeaderProps {
  title: string; // kept for compatibility; not displayed per new design
  showSettings?: boolean;
}

export function Header({ title, showSettings = true }: HeaderProps) {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const user = getUserData();

  const roleText = useMemo(() => {
    const userType = user?.user_type;
    if (!userType) return "";
    if (userType === "Customer") return "Customer";
    if (userType === "SiteSecurity") return "Site Security";
    if (userType === "SiteAdmin") return "Site Admin";
    if (userType === "QPStaff") return "Site Admin"; // Treat QPStaff as Site Admin
    return "";
  }, [user]);

  const handleLogout = () => {
    clearUserData();
    clearPodValue();
    navigate("/login");
  };

  return (
    <>
      <header className="bg-gradient-primary sticky top-0 z-50">
        <div className="mobile-container flex items-center justify-between px-0">
          <div className="flex items-center gap-2 pl-0 ml-0">
            <img
              src="https://leapmile-website.blr1.cdn.digitaloceanspaces.com/Qikpod/Images/q70.png"
              alt="Qikpod"
              className="h-8 w-auto ml-0 p-10"
            />
            <span className="text-qikpod-black font-semibold text-xs leading-8">{roleText}</span>
          </div>

          {showSettings && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-qikpod-black hover:bg-black/10 h-8 w-8 p-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0">
                <div className="h-full w-full flex flex-col px-0 mx-0">
                  <div className="px-4 py-4 border-b my-[16px]">
                    <div className="flex items-center space-x-3">
                      <img
                        src="https://leapmile-website.blr1.cdn.digitaloceanspaces.com/Qikpod/Images/q70.png"
                        alt="Qikpod"
                        className="w-auto h-8"
                      />
                      <span className="font-semibold text-foreground text-sm">Menu</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <div className="py-2">
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 px-4 rounded-none"
                          onClick={() => navigate("/customer-dashboard")}
                        >
                          <User className="mr-3 h-4 w-4" />
                          Home
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 px-4 rounded-none"
                          onClick={() => navigate("/locations")}
                        >
                          <MapPin className="mr-3 h-4 w-4" />
                          Locations
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 px-4 rounded-none"
                          onClick={() => navigate("/profile")}
                        >
                          <User className="mr-3 h-4 w-4" />
                          Profile
                        </Button>
                      </SheetClose>
                      {(user?.user_type === "SiteAdmin" ||
                        user?.user_type === "QPStaff" ||
                        user?.user_type === "SiteSecurity") && (
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 px-4 rounded-none"
                            onClick={() => navigate("/rto")}
                          >
                            <Package className="mr-3 h-4 w-4" />
                            RTO Management
                          </Button>
                        </SheetClose>
                      )}
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 px-4 rounded-none"
                          onClick={() => navigate("/support")}
                        >
                          <HelpCircle className="mr-3 h-4 w-4" />
                          Support
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                  <div className="border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12 px-4 rounded-none text-red-600"
                      onClick={() => setShowLogoutDialog(true)}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </header>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="btn-qikpod">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
