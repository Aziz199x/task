"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/context/SessionContext'; // Re-use the UserProfile type

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('*'); // Fetch all columns for all profiles

    if (error) {
      console.error("Error fetching profiles:", error.message);
      toast.error("Failed to load profiles: " + error.message);
      setError(error.message);
      setProfiles([]);
    } else if (data) {
      setProfiles(data as UserProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();

    // Realtime listener for profile changes
    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('Profile change received!', payload);
        fetchProfiles(); // Re-fetch profiles on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { profiles, loading, error, refetchProfiles: fetchProfiles };
};