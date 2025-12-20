"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/context/SessionContext';
import { toastSuccess, toastError, toastLoading, dismissToast } from '@/utils/toast'; // Import new toast helpers

const ResetPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { session } = useSession();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      toastError(t('invalid_or_expired_reset_link'));
      navigate('/login');
    }
  }, [session, navigate, t]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toastError(t('passwords_do_not_match'));
      return;
    }
    if (password.length < 6) {
      toastError(t('password_too_short'));
      return;
    }
    setLoading(true);
    const loadingToastId = toastLoading(t('updating'));

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toastError(error);
      } else {
        toastSuccess(t('password_updated_successfully'));
        await supabase.auth.signOut();
        navigate('/login');
      }
    } catch (error: any) {
      toastError(error);
    } finally {
      setLoading(false);
      dismissToast(loadingToastId);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t('reset_your_password')}</CardTitle>
          <CardDescription>{t('enter_new_password_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('new_password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirm_new_password')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('updating') : t('update_password')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;