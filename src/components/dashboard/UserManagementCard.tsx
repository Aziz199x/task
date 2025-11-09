"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfiles } from '@/hooks/use-profiles';
import { Loader2, User as UserIcon, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSession } from '@/context/SessionContext';
import { useTranslation } from 'react-i18next';

const UserManagementCard: React.FC = () => {
  const { profiles, loading, error } = useProfiles();
  const { profile: currentUserProfile } = useSession();
  const { t } = useTranslation();

  const allowedToCreateAccounts = currentUserProfile && ['admin', 'manager', 'supervisor'].includes(currentUserProfile.role);

  if (loading) {
    return (
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('manage_users')}</CardTitle>
          {allowedToCreateAccounts && (
            <Link to="/create-account">
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-2" /> {t('add')}
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>{t('manage_users')}</CardTitle>
        </CardHeader>
        <CardContent className="text-destructive">{t('error_loading_user_profiles')}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('manage_users')}</CardTitle>
        {allowedToCreateAccounts && (
          <Link to="/create-account">
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-2" /> {t('add')}
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
        {profiles.map((profile) => (
          <div key={profile.id} className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={`${profile.first_name} ${profile.last_name}`} />
              <AvatarFallback>
                <UserIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">{profile.first_name} {profile.last_name}</p>
              <p className="text-sm text-muted-foreground capitalize">{t(profile.role)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UserManagementCard;