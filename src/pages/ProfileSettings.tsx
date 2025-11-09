"use client";

import React from 'react';
import { useSession } from '@/context/SessionContext'; // Correct import
import ProfileSettingsForm from '@/components/ProfileSettingsForm';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const ProfileSettings = () => {
  const { profile, loading } = useSession();
  const { t } = useTranslation();

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8 text-destructive">
        {t('profile_not_found_contact_admin')}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg space-y-6">
      <h2 className="text-3xl font-bold mb-6 text-center">{t('profile_settings')}</h2>
      <Card>
        <CardHeader>
          <CardTitle>{t('profile_information')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;