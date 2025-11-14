import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, extractPodNameFromUrl } from "@/utils/storage";
import { apiService } from "@/services/api";
import { hasApiBaseUrl, saveApiBaseUrl } from "@/utils/apiConfig";
import { ApiBaseUrlPopup } from "@/components/ApiBaseUrlPopup";
import { LocationSelectionPopup } from "@/components/LocationSelectionPopup";
import { useMandatoryLocationSelection } from "@/hooks/useMandatoryLocationSelection";
import Login from "./Login";

const Index = () => {
  const navigate = useNavigate();
  const [showApiPopup, setShowApiPopup] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [shouldCheckLocation, setShouldCheckLocation] = useState(false);
  const { needsLocationSelection, isChecking, onLocationConfirmed } = useMandatoryLocationSelection(
    shouldCheckLocation ? userId : null
  );

  useEffect(() => {
    // Check if API base URL is configured first
    if (!hasApiBaseUrl()) {
      setShowApiPopup(true);
      return;
    }

    // Extract pod name from URL on page load
    const podName = extractPodNameFromUrl();
    
    if (podName) {
      // Call API to get pod info and store location_id
      apiService.getPodInfo(podName)
        .then((podInfo) => {
          localStorage.setItem('current_location_id', podInfo.location_id);
        })
        .catch((error) => {
          console.error('Failed to fetch pod info:', error);
        });
    }

    // Check if user is logged in
    if (isLoggedIn()) {
      const userData = JSON.parse(localStorage.getItem('qikpod_user') || '{}');
      setUserId(userData.id);
      setShouldCheckLocation(true);
    }
  }, [navigate]);

  // Handle navigation after location is confirmed or not needed
  useEffect(() => {
    if (!isChecking && shouldCheckLocation && !needsLocationSelection) {
      const userData = JSON.parse(localStorage.getItem('qikpod_user') || '{}');
      
      // Treat QPStaff as SiteAdmin
      const userType = userData.user_type === 'QPStaff' ? 'SiteAdmin' : userData.user_type;
      
      switch (userType) {
        case 'SiteAdmin':
          navigate('/site-admin-dashboard');
          break;
        case 'Customer':
          navigate('/customer-dashboard');
          break;
        case 'SiteSecurity':
          navigate('/site-security-dashboard');
          break;
        default:
          navigate('/login');
      }
    }
  }, [isChecking, shouldCheckLocation, needsLocationSelection, navigate]);

  const handleApiBaseUrlSubmit = (baseUrl: string) => {
    saveApiBaseUrl(baseUrl);
    setShowApiPopup(false);
    // After setting API URL, continue with normal flow
    window.location.reload();
  };

  // Show API popup if not configured
  if (showApiPopup) {
    return <ApiBaseUrlPopup open={showApiPopup} onSubmit={handleApiBaseUrlSubmit} />;
  }

  // Show location selection popup if user is logged in but has no location
  if (needsLocationSelection && userId && !isChecking) {
    return <LocationSelectionPopup userId={userId} onLocationConfirmed={onLocationConfirmed} />;
  }

  // Show login page directly instead of redirecting
  return <Login />;
};

export default Index;
