"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/context/SessionContext';
import { useSession } from '@/context/SessionContext';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Import useQuery and useQueryClient
import { toastError, toastWarning } from '@/utils/toast'; // Import new toast helpers
import i18n from '@/i18n'; // Import i18n for translation

// Extend UserProfile type locally to include email
export interface ProfileWithEmail extends UserProfile {
  email: string | null;
}

// Query key definition
const PROFILES_QUERY_KEY = ['profiles'];

// Fetcher function for profiles
const fetchAllProfiles = async (accessToken: string | undefined): Promise<ProfileWithEmail[]> => {
  // 1. Fetch all profiles (public data)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .order('first_name', { ascending: true });

  if (profileError) {
    throw profileError;
  }

  let profilesWithEmails: ProfileWithEmail[] = profileData.map(p => ({ ...p, email: null })) as ProfileWithEmail[];
  
  // 2. Fetch emails using Edge Function (only if authenticated)
  if (accessToken) {
    const userIds = profileData.map(p => p.id);
    try {
      const { data: emailData, error: emailError } = await supabase.functions.invoke('list-user-emails', {
        body: { userIds },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (emailError) {
        console.warn("Warning: Failed to fetch user emails via Edge Function (Permission issue or function error). Falling back to ID display.", emailError.message);
        toastWarning(i18n.t('failed_to_fetch_user_emails_warning', { message: emailError.message }));
      } else if (emailData && Array.isArray(emailData)) {
        const emailMap = new Map(emailData.map(item => [item.id, item.email]));
        profilesWithEmails = profilesWithEmails.map(p => ({
          ...p,
          email: emailMap.get(p.id) || null,
        }));
      }
    } catch (e: any) {
      console.warn("Warning: Failed to invoke list-user-emails function:", e.message);
      toastWarning(i18n.t('failed_to_invoke_list_user_emails_function', { message: e.message }));
    }
  }

  return profilesWithEmails;
};

export const useProfiles = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading, error, refetch } = useQuery<ProfileWithEmail[], Error>({
    queryKey: PROFILES_QUERY_KEY,
    queryFn: () => fetchAllProfiles(session?.access_token),
    enabled: !!session, // Only run query if session exists
    staleTime: 1000 * 60 * 1, // Reduced stale time to 1 minute
    refetchInterval: 1000 * 30, // Polling every 30 seconds
  });

  // Use a useEffect to handle errors and display toasts
  useEffect(() => {
    if (error) {
      toastError(error);
    }
  }, [error]);

  // Set up real-time subscription for profile updates
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('Profile change received!', payload);
        // Invalidate the query cache to trigger a refetch
        queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, queryClient]);

  return { profiles, loading: isLoading, error: error ? error.message : null, refetchProfiles: refetch };
};