'use client';
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOffline(!window.navigator.onLine);
      const handleOnline = () => setOffline(false);
      const handleOffline = () => setOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  if (!offline) return null;
  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-red-600 text-white text-center py-2 shadow-md animate-pulse">
      You are offline. Some features may be unavailable.
    </div>
  );
} 