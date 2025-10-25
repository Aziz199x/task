"use client";

import { useMemo } from 'react';
import { useProfiles } from './use-profiles';
import { UserProfile } from '@/context/SessionContext';

export interface TechnicianProfile extends UserProfile {}

export const useTechnicians = () => {
  const { profiles, loading, error, refetchProfiles } = useProfiles();

  const technicians = useMemo(() => {
    return profiles.filter(profile => profile.role === 'technician');
  }, [profiles]);

  return { technicians, loading, error, refetchTechnicians: refetchProfiles };
};