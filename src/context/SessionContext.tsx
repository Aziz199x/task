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

const INITIAL_LOAD_TIMEOUT_MS = 5000; // 5 seconds failsafe

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const { t } = useTranslation();

  // Use a ref to track if loading has been resolved to prevent multiple calls
  const loadingResolvedRef = React.useRef(false);
  const isSigningOutRef = React.useRef(false);

  const resolveLoading = useCallback(() => {
    if (!loadingResolvedRef.current) {
      loadingResolvedRef.current = true;
      setIsLoadingInitial(false);
      console.log("[SessionProvider] Initial loading resolved.");
    }
  }, []);

  // New function to create a profile if one is missing
  const createProfileForUser = useCallback(async (user: User): Promise<UserProfile | null> => {
    console.log(`[SessionProvider] Attempting to create profile for new/missing user: ${user.id}`);
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        role: (user.user_metadata?.role as UserProfile['role']) || 'technician', // Default role
        updated_at: new Date().toISOString(),
        phone_number: user.user_metadata?.phone_number || null,
      });

    if (insertError) {
      console.error("[SessionProvider] Error creating profile:", insertError.message);
      toast.error(`${t('failed_to_create_profile_fallback')} ${insertError.message}`);
      return null;
    }
    console.log("[SessionProvider] Profile created successfully via fallback.");
    // After creating, try to fetch it again to get the full object
    // This recursive call should now succeed as the profile exists
    return fetchUserProfile(user.id); 
  }, [t]);

  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    console.log(`[SessionProvider] Attempting to fetch profile for user: ${userId}`);
    // Ensure there's an active session before trying to fetch profile
    const currentSession = await supabase.auth.getSession();
    if (!currentSession.data.session) {
      console.warn("[SessionProvider] No active session found, cannot fetch profile. Setting profile to null.");
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Check if the error is specifically 'PGRST116' (no rows found for single())
      if (error.code === 'PGRST116') {
        console.warn(`[SessionProvider] Profile not found for user ${userId}. Attempting to create one.`);
        // Attempt to create a profile for this user
        const createdProfile = await createProfileForUser(currentSession.data.session.user);
        if (createdProfile) {
          setProfile(createdProfile);
          return createdProfile;
        }
        // If creation also fails, then set profile to null
        setProfile(null);
        return null;
      } else {
        console.error("[SessionProvider] Error fetching profile:", error.message);
        toast.error(`${t('error_loading_user_profiles')} ${error.message}`); // Add toast for profile fetch error
        setProfile(null);
        return null;
      }
    } else if (data) {
      console.log("[SessionProvider] Profile fetched successfully:", data);
      setProfile(data as UserProfile);
      return data as UserProfile;
    }
    console.log("[SessionProvider] No profile found for user (unexpected path):", userId);
    setProfile(null);
    return null;
  }, [t, createProfileForUser]); // Add createProfileForUser to dependencies

  useEffect(() => {
    let isMounted = true;
    console.log("[SessionProvider] Initializing auth listener...");

    // Failsafe timeout: Force resolution after 5 seconds
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn("[SessionProvider] Initial load timed out after 5 seconds. Forcing resolution.");
        resolveLoading();
      }
    }, INITIAL_LOAD_TIMEOUT_MS);

    const initializeAuth = async () => {
      
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          if (!isMounted) return;
          console.log(`[SessionProvider] Auth state change: ${event}`, currentSession);

          if (event === 'SIGNED_OUT') {
            if (!isSigningOutRef.current) {
              console.log("[SessionProvider] Remote sign-out detected.");
              toast.warning(t('remote_sign_out_notification'));
            } else {
              console.log("[SessionProvider] Local sign-out detected.");
              toast.success(t('signed_out_successfully')); // Explicit success toast on local sign out
            }
            isSigningOutRef.current = false; // Reset for next sign-in
            setSession(null);
            setUser(null);
            setProfile(null);
            resolveLoading(); // Ensure loading is resolved on sign out
            return;
          }

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
          resolveLoading();
        }
      );

      // Manually check initial session state if the listener hasn't fired yet (rare, but safe)
      if (!loadingResolvedRef.current) {
        try {
          console.log("[SessionProvider] Performing manual initial session check...");
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          if (initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchUserProfile(initialSession.user.id);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } catch (e) {
          console.error("[SessionProvider] Failed to retrieve initial session manually:", e);
          setSession(null);
          setUser(null);
          setProfile(null);
        } finally {
          // Ensure loading resolves even if manual check fails
          if (isMounted) {
            resolveLoading();
          }
        }
      }


      return () => {
        clearTimeout(timeoutId);
        console.log("[SessionProvider] Unsubscribing from auth listener.");
        authListener.subscription.unsubscribe();
      };
    };

    initializeAuth();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      console.log("[SessionProvider] Component unmounted, cleaning up.");
    };
  }, [t, fetchUserProfile, resolveLoading]);

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
    isSigningOutRef.current = true;
    
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
      // The auth listener handles the success toast now, but we ensure isSigningOutRef is true
      // so it shows the local sign out message instead of the remote one.
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