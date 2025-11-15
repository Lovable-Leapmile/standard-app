import { useEffect, useState } from "react";
import { hasApiBaseUrl, saveApiBaseUrl } from "@/utils/apiConfig";
import { ApiBaseUrlPopup } from "./ApiBaseUrlPopup";

interface ApiGuardProps {
  children: React.ReactNode;
}

export const ApiGuard = ({ children }: ApiGuardProps) => {
  const [showApiPopup, setShowApiPopup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const environment = import.meta.env.VITE_ENVIRONMENT;
    const envApiUrl = import.meta.env.VITE_API_BASE_URL;

    // If production environment with API URL set, use it automatically
    if (environment === 'production' && envApiUrl) {
      if (!hasApiBaseUrl()) {
        saveApiBaseUrl(envApiUrl);
      }
      setIsChecking(false);
      return;
    }

    // For staging or if no env URL, check if API base URL is configured
    if (!hasApiBaseUrl()) {
      setShowApiPopup(true);
    }
    setIsChecking(false);
  }, []);

  const handleApiBaseUrlSubmit = (baseUrl: string) => {
    saveApiBaseUrl(baseUrl);
    setShowApiPopup(false);
    // Reload to ensure all components use the new API URL
    window.location.reload();
  };

  // Show API popup if not configured
  if (showApiPopup) {
    return <ApiBaseUrlPopup open={showApiPopup} onSubmit={handleApiBaseUrlSubmit} />;
  }

  // Show nothing while checking
  if (isChecking) {
    return null;
  }

  return <>{children}</>;
};
