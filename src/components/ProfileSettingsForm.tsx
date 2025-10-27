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
  const { profile, user, loading: sessionLoading, refetchProfile } = useSession(); // Get refetchProfile
  const { t } = useTranslation();

  // Cast profile to include phone_number for easier access
  const currentProfile = profile as ProfileWithPhone | null;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentProfile) {
      setFirstName(currentProfile.first_name || '');
      setLastName(currentProfile.last_name || '');
      setPhoneNumber(currentProfile.phone_number || '');
    }
  }, [currentProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      return;
    }

    setLoading(true);

    const updates = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phoneNumber.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Update the public profile table (This is the source of truth)
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // 2. Explicitly refetch profile to ensure UI updates immediately
      await refetchProfile(user.id);

      toast.success(t('profile_updated_successfully'));
    } catch (error: any) {
      console.error("[ProfileSettingsForm] Caught error during profile update:", error);
      toast.error(`${t('failed_to_update_profile')}: ${error.message}`);
    } finally {
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