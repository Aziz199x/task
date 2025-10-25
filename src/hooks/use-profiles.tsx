"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/context/SessionContext';
import { useSession } from '@/context/SessionContext';

// Extend UserProfile type locally to include email
export interface ProfileWithEmail extends UserProfile {
  email: string | null;
}

export const useProfiles = () => {
  const { session } = useSession();
  const [profiles, setProfiles] = useState<ProfileWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1. Fetch all profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('first_name', { ascending: true });

    if (profileError) {
      console.error("Error fetching profiles:", profileError.message);
      toast.error("Failed to load profiles: " + profileError.message);
      setError(profileError.message);
      setProfiles([]);
      setLoading(false);
      return;
    }

    let profilesWithEmails: ProfileWithEmail[] = profileData.map(p => ({ ...p, email: null })) as ProfileWithEmail[];
    
    // 2. Fetch emails using Edge Function (only if authenticated)
    if (session?.access_token) {
      const userIds = profileData.map(p => p.id);
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('list-user-emails', {
          body: { userIds },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (emailError) {
          console.warn("Warning: Failed to fetch user emails via Edge Function (Permission issue or function error). Falling back to ID display.", emailError.message);
        } else if (emailData && Array.isArray(emailData)) {
          const emailMap = new Map(emailData.map(item => [item.id, item.email]));
          profilesWithEmails = profilesWithEmails.map(p => ({
            ...p,
            email: emailMap.get(p.id) || null,
          }));
        }
      } catch (e: any) {
        console.warn("Warning: Failed to invoke list-user-emails function:", e.message);
      }
    }

    setProfiles(profilesWithEmails);
    setLoading(false);
  }, [session?.access_token]);

  useEffect(() => {
    if (session) {
      fetchProfiles();
    } else {
      setProfiles([]);
      setLoading(false);
    }

    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('Profile change received!', payload);
        // Since we rely on the Edge Function for emails, we refetch everything on change
        // to ensure data consistency, especially after user creation/deletion.
        fetchProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchProfiles]);

  return { profiles, loading, error, refetchProfiles: fetchProfiles };
};