"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/context/SessionContext';
import { UserProfile } from '@/context/SessionContext';

export const useAssignableUsers = () => {
  const { profile: currentUserProfile } = useSession();
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserProfile) {
      setLoading(false);
      return;
    }

    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role')
        .order('first_name', { ascending: true });

      if (error) {
        console.error("Error fetching assignable users:", error.message);
        toast.error("Failed to load users: " + error.message);
        setError(error.message);
        setAllProfiles([]);
      } else if (data) {
        setAllProfiles(data as UserProfile[]);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, [currentUserProfile?.id]); // Only refetch if current user changes

  const assignableUsers = useMemo(() => {
    if (!currentUserProfile) return [];

    let targetRoles: UserProfile['role'][] = [];
    
    if (currentUserProfile.role === 'admin') {
      return allProfiles; // Admins can assign to anyone
    }
    
    switch (currentUserProfile.role) {
      case 'manager':
        targetRoles = ['supervisor', 'technician', 'contractor'];
        break;
      case 'supervisor':
        targetRoles = ['technician', 'contractor'];
        break;
      case 'technician':
        targetRoles = ['contractor'];
        break;
      default:
        targetRoles = [];
    }

    return allProfiles.filter(profile => targetRoles.includes(profile.role));
  }, [allProfiles, currentUserProfile]);

  return { assignableUsers, loading, error };
};