"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/context/SessionContext';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('first_name', { ascending: true });

    if (error) {
      console.error("Error fetching profiles:", error.message);
      toast.error("Failed to load profiles: " + error.message);
      setError(error.message);
      setProfiles([]);
    } else if (data) {
      setProfiles(data as UserProfile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();

    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('Profile change received!', payload);
        
        const newProfile = payload.new as UserProfile;
        const oldProfile = payload.old as { id: string };

        switch (payload.eventType) {
          case 'INSERT':
            setProfiles(currentProfiles => {
              if (currentProfiles.some(p => p.id === newProfile.id)) {
                return currentProfiles;
              }
              return [...currentProfiles, newProfile].sort((a, b) => 
                (a.first_name || '').localeCompare(b.first_name || '')
              );
            });
            break;
          case 'UPDATE':
            setProfiles(currentProfiles => 
              currentProfiles.map(p => p.id === newProfile.id ? newProfile : p)
            );
            break;
          case 'DELETE':
            setProfiles(currentProfiles => 
              currentProfiles.filter(p => p.id !== oldProfile.id)
            );
            break;
          default:
            break;
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfiles]);

  return { profiles, loading, error, refetchProfiles: fetchProfiles };
};