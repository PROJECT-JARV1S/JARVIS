import { useEffect, useState } from 'react';
import { getSystemInfo, onTelemetryReceived, SystemInfo, isTelemetrySimulated } from '@/services/system.service';

export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isSimulated, setIsSimulated] = useState(isTelemetrySimulated());

  useEffect(() => {
    // Fetch initial cached state immediately
    getSystemInfo().then((info) => {
      setSystemInfo(info);
      setIsSimulated(isTelemetrySimulated());
    }).catch(console.error);

    // Subscribe to live events
    let unlisten: (() => void) | undefined;
    const setupListener = async () => {
      try {
        unlisten = await onTelemetryReceived((info) => {
          setSystemInfo(info);
          setIsSimulated(isTelemetrySimulated());
        });
      } catch (err) {
        console.error('Failed to subscribe to telemetry:', err);
      }
    };
    setupListener();

    // Clean up subscription on unmount
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return { systemInfo, isSimulated };
};
