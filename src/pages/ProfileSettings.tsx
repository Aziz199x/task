"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProfileSettingsForm from '@/components/ProfileSettingsForm';
import { useTranslation } from 'react-i18next';

const ProfileSettings = () => {
  const { profile, refetchProfile } = useSession();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [uploading, setUploading] = useState(false);
  const [avatar, setAvatar] = useState(profile?.avatar || '');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-center">{t('settings')}</h2>
      <Card>
        <CardHeader>
          <CardTitle>{t('profile_information')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="avatar">{t('profile_picture')}</Label>
            <Input id="avatar" type="file" onChange={handleAvatarChange} disabled={uploading} />
            {uploading && <p>{t('uploading')}...</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">{t('first_name')}</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t('last_name')}</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('phone')}</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('change_password')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('new_password')}</Label>
            <Input id="newPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirm_password')}</Label>
            <Input id="confirmPassword" type="password" />
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ProfileSettings;