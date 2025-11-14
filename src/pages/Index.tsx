import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, extractPodNameFromUrl } from "@/utils/storage";
import { apiService } from "@/services/api";
import { hasApiBaseUrl, saveApiBaseUrl } from "@/utils/apiConfig";
import { ApiBaseUrlPopup } from "@/components/ApiBaseUrlPopup";
import Login from "./Login";

const Index = () => {
  const navigate = useNavigate();
  const [showApiPopup, setShowApiPopup] = useState(false);

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

    // Check if user is logged in and redirect accordingly
    if (isLoggedIn()) {
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
  }, [navigate]);

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

  // Show login page directly instead of redirecting
  return <Login />;
};

export default Index;
