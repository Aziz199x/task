"use client";

import React from 'react';
import Layout from '@/components/Layout';
import ProfileSettingsForm from '@/components/ProfileSettingsForm';
import { useTranslation } from 'react-i18next';

const ProfileSettings: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-6 text-center">{t('profile_settings')}</h2>
      <ProfileSettingsForm />
    </Layout>
  );
};

export default ProfileSettings;