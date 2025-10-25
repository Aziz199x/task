"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession, UserProfile } from '@/context/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Extend UserProfile type locally to include phone_number for type safety
interface ProfileWithPhone extends UserProfile {
  phone_number: string | null;
}

const ProfileSettingsForm: React.FC = () => {
  const { profile, user, loading: sessionLoading } = useSession();
  const { t } = useTranslation();

  // Cast profile to include phone_number for easier access
  const currentProfile = profile as ProfileWithPhone | null;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("[ProfileSettingsForm] currentProfile updated:", currentProfile);
    if (currentProfile) {
      setFirstName(currentProfile.first_name || '');
      setLastName(currentProfile.last_name || '');
      setPhoneNumber(currentProfile.phone_number || '');
    }
  }, [currentProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.log("[ProfileSettingsForm] No user found, cannot update profile.");
      return;
    }

    setLoading(true);
    console.log("[ProfileSettingsForm] Starting profile update for user:", user.id);

    const updates = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phoneNumber.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Update the public profile table
      console.log("[ProfileSettingsForm] Updating public.profiles table with:", updates);
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (profileError) {
        console.error("[ProfileSettingsForm] Error updating public.profiles:", profileError);
        throw profileError;
      }
      console.log("[ProfileSettingsForm] public.profiles updated successfully.");

      // 2. Update auth user metadata
      console.log("[ProfileSettingsForm] Updating auth.users metadata with:", { first_name: firstName.trim(), last_name: lastName.trim() });
      const { error: userError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }
      });

      if (userError) {
        console.warn("[ProfileSettingsForm] Failed to update user metadata:", userError.message);
        // Do not throw here, as profile update might have succeeded
      }
      console.log("[ProfileSettingsForm] Auth user metadata update attempted.");

      toast.success(t('profile_updated_successfully'));
    } catch (error: any) {
      console.error("[ProfileSettingsForm] Caught error during profile update:", error);
      toast.error(`${t('failed_to_update_profile')}: ${error.message}`);
    } finally {
      console.log("[ProfileSettingsForm] Finally block executed, setting loading to false.");
      setLoading(false);
    }
  };

  if (sessionLoading || !currentProfile) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">{t('profile_settings')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted" />
          </div>
          <div>
            <Label htmlFor="firstName">{t('first_name')}</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">{t('last_name')}</Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">{t('phone_number_optional')}</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t('phone_number_placeholder')}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t('save_changes')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSettingsForm;