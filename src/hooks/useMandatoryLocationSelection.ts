import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';

export const useMandatoryLocationSelection = (userId: number | null) => {
  const [needsLocationSelection, setNeedsLocationSelection] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsChecking(false);
      return;
    }

    checkUserLocation();
  }, [userId]);

  const checkUserLocation = async () => {
    try {
      const locations = await apiService.getUserLocations(userId!);
      
      // Check if user has no locations or location_id is 0
      const hasValidLocation = locations.length > 0 && 
        locations.some(loc => loc.location_id && loc.location_id !== 0);
      
      setNeedsLocationSelection(!hasValidLocation);
    } catch (error: any) {
      // If 404 or any error, treat as no location
      console.log('User location check:', error);
      setNeedsLocationSelection(true);
    } finally {
      setIsChecking(false);
    }
  };

  const onLocationConfirmed = () => {
    setNeedsLocationSelection(false);
  };

  return {
    needsLocationSelection,
    isChecking,
    onLocationConfirmed
  };
};
