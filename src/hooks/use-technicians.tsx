"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TechnicianProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'supervisor' | 'technician';
}

export const useTechnicians = () => {
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTechnicians = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role')
        .eq('role', 'technician'); // Filter for technicians

      if (error) {
        console.error("Error fetching technicians:", error.message);
        toast.error("Failed to load technicians: " + error.message);
        setError(error.message);
        setTechnicians([]);
      } else if (data) {
        setTechnicians(data as TechnicianProfile[]);
      }
      setLoading(false);
    };

    fetchTechnicians();
  }, []);

  return { technicians, loading, error };
};