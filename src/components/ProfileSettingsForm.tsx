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
  const { profile, user, loading: sessionLoading, refetchProfile } = useSession();
  const { t } = useTranslation();

  const currentProfile = profile as ProfileWithPhone | null;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (currentProfile) {
      setFirstName(currentProfile.first_name || '');
      setLastName(currentProfile.last_name || '');
      setPhoneNumber(currentProfile.phone_number || '');
    }
  }, [currentProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const updates = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phoneNumber.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error: profileError } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (profileError) throw profileError;
      await refetchProfile(user.id);
      toast.success(t('profile_updated_successfully'));
    } catch (error: any) {
      toast.error(`${t('failed_to_update_profile')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('passwords_do_not_match'));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t('password_too_short'));
      return;
    }
    setPasswordLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('password_updated_short'));
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordLoading(false);
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
          <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
            <Label htmlFor="email" className="md:text-right">{t('email')}</Label>
            <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted md:col-span-3" />
          </div>
          <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
            <Label htmlFor="firstName" className="md:text-right">{t('first_name')}</Label>
            <Input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="md:col-span-3" />
          </div>
          <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
            <Label htmlFor="lastName" className="md:text-right">{t('last_name')}</Label>
            <Input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="md:col-span-3" />
          </div>
          <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
            <Label htmlFor="phoneNumber" className="md:text-right">{t('phone_number_optional')}</Label>
            <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder={t('phone_number_placeholder')} className="md:col-span-3" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t('save_changes')}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t">
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <h3 className="text-lg font-medium text-center">{t('change_password')}</h3>
            <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
              <Label htmlFor="newPassword" className="md:text-right">{t('new_password')}</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required className="md:col-span-3" />
            </div>
            <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
              <Label htmlFor="confirmPassword" className="md:text-right">{t('confirm_new_password')}</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="md:col-span-3" />
            </div>
            <Button type="submit" className="w-full" disabled={passwordLoading}>
              {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t('update_password')}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSettingsForm;