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

    // Production: never show popup, env var is used directly
    if (environment === 'production') {
      setIsChecking(false);
      return;
    }

    // Staging: show popup if no API base URL is stored in localStorage
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
