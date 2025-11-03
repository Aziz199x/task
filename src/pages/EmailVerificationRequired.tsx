"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { Link } from 'react-router-dom';

const EmailVerificationRequired: React.FC = () => {
  const { t } = useTranslation();
  const { user, signOut } = useSession();
  const [loading, setLoading] = useState(false);

  const handleResendEmail = async () => {
    if (!user?.email) {
      toast.error(t('no_email_found'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('verification_email_resent'));
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-6 text-center">
        <CardHeader>
          <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
          <CardTitle className="text-2xl font-bold">{t('email_verification_required_title')}</CardTitle>
          <CardDescription>
            {t('email_verification_required_description', { email: user?.email || t('your_account_email') })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleResendEmail} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t('resend_verification_email')}
          </Button>
          <Button variant="outline" onClick={signOut} className="w-full">
            {t('sign_out')}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t('after_verification_sign_in_again')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationRequired;