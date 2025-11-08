"use client";

import React from 'react';
import ProfileSettingsForm from '@/components/ProfileSettingsForm';
import { useTranslation } from 'react-i18next';

const ProfileSettings: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-center">{t('settings')}</h2>
      <ProfileSettingsForm />
    </>
  );
};

export default ProfileSettings;