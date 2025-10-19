"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'supervisor' | 'technician';
  updated_at: string | null;
}

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching profiles:", error.message);
        setError(error.message);
        toast.error("Failed to load profiles: " + error.message);
        setProfiles([]);
      } else if (data) {
        setProfiles(data as Profile[]);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, []);

  return { profiles, loading, error };
};