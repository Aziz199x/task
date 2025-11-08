"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useSession, UserProfile } from '@/context/SessionContext';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Form, FormLabel, FormMessage, FormItem, FormField, FormControl } from '@/components/ui/form';
import PhotoUploader from './PhotoUploader';

// Extend UserProfile type locally to include phone_number for type safety
interface ProfileWithPhone extends UserProfile {
  phone_number: string | null;
}

const profileFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().optional(),
  avatar_url: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileSettingsForm: React.FC = () => {
  const { profile, user, loading: sessionLoading, refetchProfile } = useSession();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const currentProfile = profile as ProfileWithPhone | null;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone_number: profile.phone_number || '',
      avatar_url: profile.avatar_url || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    setLoading(true);
    const { error: profileError } = await supabase.from('profiles').update({
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone_number,
      avatar_url: data.avatar_url,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    if (profileError) throw profileError;
    await refetchProfile(user.id);
    toast.success(t('profile_updated_successfully'));
    setLoading(false);
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile_picture')}</FormLabel>
              <FormControl>
                <PhotoUploader
                  label={t('profile_picture')}
                  bucketName="avatars"
                  folderName={user.id}
                  currentImageUrl={field.value}
                  onUploadSuccess={(url) => {
                    field.onChange(url);
                    toast.success(t('avatar_uploaded_successfully'));
                  }}
                  onRemove={async () => {
                    if (!field.value) return;
                    const path = new URL(field.value).pathname.split('/avatars/')[1];
                    await supabase.storage.from('avatars').remove([path]);
                    field.onChange('');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('first_name')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('first_name_placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('last_name')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('last_name_placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('phone_number_optional')}</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder={t('phone_number_placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
    </Form>
  );
};

export default ProfileSettingsForm;