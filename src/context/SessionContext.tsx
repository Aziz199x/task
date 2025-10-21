"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'supervisor' | 'technician' | 'contractor';
  updated_at: string | null;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start loading as true

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("SessionProvider: Error fetching profile:", error.message);
      setProfile(null);
      return null;
    } else if (data) {
      setProfile(data as UserProfile);
      return data as UserProfile;
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component
    let initialLoadHandled = false; // Flag to ensure setLoading(false) is called only once

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return; // Prevent state updates if component unmounted

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }

        // Set loading to false only after the very first auth state change event
        // This covers INITIAL_SESSION, SIGNED_IN, or SIGNED_OUT
        if (!initialLoadHandled) {
          setLoading(false);
          initialLoadHandled = true;
        }

        if (event === 'SIGNED_OUT') {
          toast.info("You have been signed out.");
        }
      }
    );

    return () => {
      isMounted = false; // Cleanup: component is unmounted
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array to run only once on mount

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out: " + error.message);
    }
  };

  return (
    <SessionContext.Provider value={{ session, user, profile, loading, signOut }}>
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