"use client";

import { useMemo } from 'react';
import { useProfiles } from './use-profiles'; // Import useProfiles
import { UserProfile } from '@/context/SessionContext'; // Re-use the UserProfile type

export interface TechnicianProfile extends UserProfile {} // Technicians are just profiles with a specific role

export const useTechnicians = () => {
  const { profiles, loading, error, refetchProfiles } = useProfiles(); // Use the existing useProfiles hook

  const technicians = useMemo(() => {
    return profiles.filter(profile => profile.role === 'technician');
  }, [profiles]);

  // The loading and error states will now reflect the underlying useProfiles hook
  // refetchTechnicians will simply call refetchProfiles
  return { technicians, loading, error, refetchTechnicians: refetchProfiles };
};