"use client";

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { getCapacitorBaseUrl } from '@/utils/capacitor'; // Import the new utility
import { APP_URL } from '@/utils/constants'; // Import APP_URL for explicit web fallback

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessageSent(false);

    // Determine the correct redirect URL.
    // If running on a native platform, use the deep link scheme.
    // Otherwise, use the explicit public web URL (APP_URL from constants) to prevent localhost issues.
    const redirectTo = getCapacitorBaseUrl().startsWith('com.abumiral.workflow') 
      ? getCapacitorBaseUrl() 
      : `${APP_URL}/auth/callback`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      if (error.message.includes('rate limit exceeded')) {
        toast.error(t('email_rate_limit_exceeded'));
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success(t('password_reset_email_sent'));
      setMessageSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t('forgot_password_title')}</CardTitle>
          <CardDescription>{t('forgot_password_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {messageSent ? (
            <div className="text-center">
              <p>{t('check_your_email_for_reset_link')}</p>
              <Button asChild variant="link" className="mt-4">
                <Link to="/login">{t('back_to_login')}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('sending') : t('send_reset_link')}
              </Button>
            </form>
          )}
          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="underline">
              {t('back_to_login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;