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
      // Do NOT throw here, as a missing profile shouldn't block the entire app if the user object exists.
      return null; 
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
      // Initial session check is now handled by the listener below, 
      // but we keep the initial loading state until the first event fires.
      
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          if (!isMounted) return;
          console.log(`[SessionProvider] Auth state change: ${event}`, currentSession);

          // Always update session and user state immediately
          setSession(currentSession);
          const newUser = currentSession?.user ?? null;
          setUser(newUser);

          if (newUser) {
            // Fetch profile immediately
            await fetchUserProfile(newUser.id);

            // If a user just signed in, attempt to sign out other sessions (non-blocking)
            if (event === 'SIGNED_IN' && currentSession?.access_token) {
              console.log("[SessionProvider] User signed in, attempting to sign out other sessions.");
              try {
                const { error: signOutOtherError } = await supabase.functions.invoke('sign-out-other-sessions', {
                  headers: {
                    Authorization: `Bearer ${currentSession.access_token}`,
                  },
                });
                if (signOutOtherError) {
                  console.error("Error invoking sign-out-other-sessions function:", signOutOtherError.message);
                } else {
                  console.log("Successfully invoked sign-out-other-sessions function.");
                }
              } catch (e: any) {
                console.error("Exception invoking sign-out-other-sessions function:", e.message);
              }
            }
          } else {
            setProfile(null);
          }
          
          // Mark loading complete after the first state change is processed
          if (isMounted && isLoadingInitial) {
            setIsLoadingInitial(false);
            console.log("[SessionProvider] Initial loading complete.");
          }
        }
      );

      // Manually check initial session state if the listener hasn't fired yet (rare, but safe)
      if (isLoadingInitial) {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchUserProfile(initialSession.user.id);
        }
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }


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
    
    // 1. Optimistically clear local state immediately
    setSession(null);
    setUser(null);
    setProfile(null);
    
    // 2. Attempt network sign out
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("[SessionProvider] Failed to sign out on network:", error.message);
      // If network sign out fails, we rely on the local state clear and the auth listener eventually catching up.
      // We inform the user but don't revert the local state change.
      toast.error(t("failed_to_sign_out") + error.message);
    } else {
      console.log("[SessionProvider] Signed out successfully on network.");
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