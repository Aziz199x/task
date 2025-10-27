"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'supervisor' | 'technician' | 'contractor';
  updated_at: string | null;
  phone_number?: string | null; // Include phone_number here for consistency
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refetchProfile: (userId: string) => Promise<UserProfile | null>; // Expose refetch function
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const { t } = useTranslation();

  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log(`[SessionProvider] Attempting to fetch profile for user: ${userId}`);
    // Ensure there's an active session before trying to fetch profile
    const currentSession = await supabase.auth.getSession();
    if (!currentSession.data.session) {
      console.warn("[SessionProvider] No active session found, cannot fetch profile.");
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("[SessionProvider] Error fetching profile:", error.message);
      setProfile(null);
      throw error; // Re-throw the error for callers to handle
    } else if (data) {
      console.log("[SessionProvider] Profile fetched successfully:", data);
      setProfile(data as UserProfile);
      return data as UserProfile;
    }
    console.log("[SessionProvider] No profile found for user:", userId);
    setProfile(null);
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;
    console.log("[SessionProvider] Initializing auth listener...");

    const initializeAuth = async () => {
      let initialSession: Session | null = null;
      let sessionError: any = null;

      try {
        const { data, error } = await supabase.auth.getSession();
        initialSession = data.session;
        sessionError = error;
      } catch (e: any) {
        console.error("[SessionProvider] Error during getSession:", e.message);
        sessionError = e;
      }

      if (!isMounted) return;

      if (sessionError) {
        console.error("[SessionProvider] Error getting initial session:", sessionError.message);
        setSession(null);
        setUser(null);
        setProfile(null);
      } else {
        console.log("[SessionProvider] Initial session:", initialSession);
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          try {
            await fetchUserProfile(initialSession.user.id);
          } catch (e) {
            console.error("[SessionProvider] Error fetching initial user profile:", e);
          }
        } else {
          setProfile(null);
        }
      }
      
      if (isMounted) {
        setIsLoadingInitial(false);
        console.log("[SessionProvider] Initial loading complete.");
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          if (!isMounted) return;
          console.log(`[SessionProvider] Auth state change: ${event}`, currentSession);

          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            try {
              await fetchUserProfile(currentSession.user.id);
            } catch (e) {
              console.error("[SessionProvider] Error fetching user profile on auth state change:", e);
            }
          } else {
            setProfile(null);
          }

          if (event === 'SIGNED_OUT') {
            toast.info(t("you_have_been_signed_out"));
          }
        }
      );

      return () => {
        console.log("[SessionProvider] Unsubscribing from auth listener.");
        authListener.subscription.unsubscribe();
      };
    };

    initializeAuth();

    return () => {
      isMounted = false;
      console.log("[SessionProvider] Component unmounted, cleaning up.");
    };
  }, [t, fetchUserProfile]); // Depend on t and fetchUserProfile

  // Set up real-time subscription for profile updates
  useEffect(() => {
    if (!user?.id) {
      console.log("[SessionProvider] No user ID for profile real-time subscription.");
      return;
    }
    console.log(`[SessionProvider] Subscribing to profile updates for user: ${user.id}`);

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('[SessionProvider] Real-time profile update received:', payload);
          setProfile(payload.new as UserProfile);
          toast.info(t('profile_updated_realtime_notification')); // Add a toast for real-time update
        }
      )
      .subscribe((status) => {
        console.log(`[SessionProvider] Profile channel status: ${status}`);
      });

    return () => {
      console.log("[SessionProvider] Unsubscribing from profile channel.");
      supabase.removeChannel(channel);
    };
  }, [user?.id, t]);

  const signOut = async () => {
    console.log("[SessionProvider] Attempting to sign out.");
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      if (error.message.includes('Auth session missing')) {
        console.warn("[SessionProvider] Sign out failed because session was already missing. Clearing local state manually.");
        setSession(null);
        setUser(null);
        setProfile(null);
        toast.info(t("you_have_been_signed_out"));
      } else {
        console.error("[SessionProvider] Failed to sign out:", error.message);
        toast.error(t("failed_to_sign_out") + error.message);
      }
    } else {
      console.log("[SessionProvider] Signed out successfully.");
    }
  };

  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    loading: isLoadingInitial,
    signOut,
    refetchProfile: fetchUserProfile, // Expose fetchUserProfile as refetchProfile
  }), [session, user, profile, isLoadingInitial, signOut, fetchUserProfile]);

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">{t('loading')}...</span>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};