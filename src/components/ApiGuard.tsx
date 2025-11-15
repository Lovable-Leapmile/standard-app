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
    // Check if API base URL is configured
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
