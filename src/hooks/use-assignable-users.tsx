"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/context/SessionContext';
import { UserProfile } from '@/context/SessionContext';

export const useAssignableUsers = () => {
  const { profile: currentUserProfile } = useSession();
  const [assignableUsers, setAssignableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserProfile) {
      setLoading(false);
      return;
    }

    const fetchAssignableUsers = async () => {
      setLoading(true);
      setError(null);

      let targetRoles: UserProfile['role'][] = [];
      switch (currentUserProfile.role) {
        case 'admin':
          targetRoles = ['manager'];
          break;
        case 'manager':
          targetRoles = ['supervisor', 'technician'];
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

      if (targetRoles.length === 0) {
        setAssignableUsers([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role')
        .in('role', targetRoles);

      if (error) {
        console.error("Error fetching assignable users:", error.message);
        toast.error("Failed to load users: " + error.message);
        setError(error.message);
        setAssignableUsers([]);
      } else if (data) {
        setAssignableUsers(data as UserProfile[]);
      }
      setLoading(false);
    };

    fetchAssignableUsers();
  }, [currentUserProfile]);

  return { assignableUsers, loading, error };
};