'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';

export default function SessionChecker() {
  const { user, isLoading } = useUser();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkSessionStatus = async () => {
      if (user && user.deviceLimitReached) {
        return; 
      }
      if (user && !hasChecked) {
        setHasChecked(true); 

        try {
          const tokenResponse = await fetch('/api/token');
          if (!tokenResponse.ok) return;
          const { accessToken } = await tokenResponse.json();

          const sessionId = user.sid;
          if (!sessionId) return;

          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
          const statusResponse = await fetch(
            `${apiBaseUrl}/api/session/status?session_id=${sessionId}`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          
          if (!statusResponse.ok) {
              console.error("Session check failed, but continuing.");
              return;
          }

          const data = await statusResponse.json();

          if (data.status === 'inactive') {
            alert('This device has been logged out from another session.');
            window.location.href = '/api/auth/logout';
          }

        } catch (error) {
          console.error('Error checking session status:', error);
        }
      }
    };

    if (!isLoading) {
      checkSessionStatus();
    }
  }, [user, isLoading, hasChecked]);

  return null;
}

