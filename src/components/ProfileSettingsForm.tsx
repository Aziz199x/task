"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useSession, UserProfile } from '@/context/SessionContext';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Form, FormLabel, FormMessage, FormItem, FormField, FormControl } from '@/components/ui/form';
import PhotoUploader from './PhotoUploader';
import { cn } from '@/lib/utils';

// Extend UserProfile type locally to include phone_number for type safety
interface ProfileWithPhone extends UserProfile {
  phone_number: string | null;
}

// Regex for basic E.164 phone number format (optional + followed by 7-15 digits)
const E164_PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

const profileFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().optional().refine(val => !val || E164_PHONE_REGEX.test(val), {
    message: "Invalid phone number format (e.g., +966501234567)",
  }),
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
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const currentProfile = profile as ProfileWithPhone | null;

  // Helper function for fallback translation
  const translate = useCallback((key: string) => t(key, { defaultValue: key.replace(/[_-]/g, ' ') }), [t]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone_number: profile?.phone_number || '',
      avatar_url: profile?.avatar_url || '',
    },
    mode: 'onChange',
  });

  // Reset form defaults when profile loads/changes
  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone_number: (profile as ProfileWithPhone).phone_number || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile, form]);

  // Handle password validation locally
  useEffect(() => {
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setPasswordMismatch(true);
    } else {
      setPasswordMismatch(false);
    }
  }, [newPassword, confirmPassword]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error: profileError } = await supabase.from('profiles').update({
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number || null,
        avatar_url: data.avatar_url || null,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      if (profileError) throw profileError;
      await refetchProfile(user.id);
      toast.success(translate('profile_updated_successfully'));
    } catch (error: any) {
      console.error("Profile update failed:", error);
      toast.error(translate('failed_to_update_profile') + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordMismatch || newPassword.length < 6) {
      toast.error(translate('password_too_short'));
      return;
    }
    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(translate('password_updated_short'));
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const isPasswordFormValid = newPassword.length >= 6 && newPassword === confirmPassword;

  if (sessionLoading || !currentProfile) {
    return (
      <CardContent className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Profile Picture Field */}
        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>{translate('settings.profile_picture')}</FormLabel>
              <FormControl>
                <PhotoUploader
                  label={translate('settings.profile_picture')}
                  bucketName="avatars"
                  folderName={user.id}
                  currentImageUrl={field.value}
                  onUploadSuccess={(url) => {
                    field.onChange(url);
                    toast.success(translate('avatar_uploaded_successfully'));
                  }}
                  onRemove={async () => {
                    if (!field.value) return;
                    // Extract path from public URL
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
        
        {/* First Name Field */}
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>{translate('settings.first_name')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={translate('first_name_placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Last Name Field */}
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>{translate('settings.last_name')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={translate('last_name_placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Phone Number Field */}
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>{translate('settings.phone_optional')}</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder={translate('phone_number_placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={loading || !form.formState.isValid}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : translate('settings.save_changes')}
        </Button>
      </form>

      {/* Password Change Section */}
      <div className="mt-6 pt-6 border-t space-y-4">
        <h3 className="text-lg font-semibold text-start">{translate('settings.change_password')}</h3>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">{translate('settings.new_password')}</Label>
            <Input 
              id="newPassword" 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>
          
          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{translate('settings.confirm_new_password')}</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
              className={cn(passwordMismatch && "border-destructive ring-2 ring-destructive")}
            />
            {passwordMismatch && (
              <p className="text-sm font-medium text-destructive">{translate('passwords_do_not_match')}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={passwordLoading || !isPasswordFormValid}>
            {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : translate('settings.update_password')}
          </Button>
        </form>
      </div>
    </Form>
  );
};

export default ProfileSettingsForm;