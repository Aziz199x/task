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

      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role');

      if (currentUserProfile.role === 'admin') {
        // Admins can assign to anyone, so fetch all profiles
        // No additional .in('role', ...) filter needed
      } else {
        let targetRoles: UserProfile['role'][] = [];
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

        if (targetRoles.length === 0) {
          setAssignableUsers([]);
          setLoading(false);
          return;
        }
        query = query.in('role', targetRoles);
      }

      const { data, error } = await query;

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