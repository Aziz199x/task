"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    let isMounted = true;

    const handleAuthStateChange = async (event: string, currentSession: Session | null) => {
      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user || null);

      if (currentSession?.user) {
        await fetchUserProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }

      if (event === 'SIGNED_OUT') {
        toast.info("You have been signed out.");
        navigate('/login');
      } else if (event === 'SIGNED_IN') {
        if (window.location.pathname === '/login' || window.location.pathname === '/forgot-password') {
          navigate('/');
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    const getInitialSession = async () => {
      const { data: { session: initialSession }, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        navigate('/login');
        return;
      }

      setSession(initialSession);
      setUser(initialSession?.user || null);

      if (initialSession?.user) {
        await fetchUserProfile(initialSession.user.id);
        if (window.location.pathname === '/login' || window.location.pathname === '/forgot-password') {
          navigate('/');
        }
      } else {
        setProfile(null);
        if (window.location.pathname !== '/login' && window.location.pathname !== '/forgot-password' && window.location.pathname !== '/reset-password') {
          navigate('/login');
        }
      }
      setLoading(false);
    };

    getInitialSession();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

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