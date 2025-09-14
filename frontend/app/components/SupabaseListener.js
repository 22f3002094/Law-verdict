'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SupabaseListener() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) {
      return;
    }

    const channelName = `user-updates:${user.sub}`;
    const channel = supabase.channel(channelName);

    const handleSessionChange = async (payload) => {
      console.log('Real-time event "session-change" received:', payload);
      
      const terminatedId = payload.terminated_session_id;
      if (!terminatedId) return;

      try {
        
        const sessionResponse = await fetch('/api/session');
        if (!sessionResponse.ok) return;

        const { sid: currentSessionId } = await sessionResponse.json();
        if (!currentSessionId) return;

        
        if (currentSessionId === terminatedId) {
          alert('This device has been logged out from another session.');
          window.location.href = '/api/auth/logout';
        } else {
          console.log('Another device was logged out. This session is safe.');
        }

      } catch (e) {
        console.error("Error handling session change event:", e);
      }
    };

    channel
      .on('broadcast', { event: 'session-change' }, ({ payload }) => handleSessionChange(payload))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to real-time channel: ${channelName}`);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}

