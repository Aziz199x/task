"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSession } from '@/context/SessionContext';
import { useTasks } from '@/context/TaskContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { refetchProfile } = useSession();
  const { refetchTasks } = useTasks();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const postAuthSync = async (userId: string) => {
    console.log("[AuthCallback] Triggering post-auth data sync.");
    await Promise.allSettled([
      refetchProfile(userId),
      refetchTasks(),
    ]);
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      const url = window.location.href;
      
      // 1. Check for error parameters (e.g., from password reset failure)
      const urlParams = new URLSearchParams(window.location.search);
      const errorCode = urlParams.get('error_code');
      const errorDescription = urlParams.get('error_description');

      if (errorCode || errorDescription) {
        console.error("Auth Callback Error:", errorCode, errorDescription);
        if (errorCode === '401' || errorDescription?.includes('otp_expired') || errorDescription?.includes('invalid')) {
          setErrorMessage(t('auth_link_expired_request_new'));
        } else {
          setErrorMessage(t('auth_link_invalid_try_again'));
        }
        setStatus('error');
        return;
      }

      // 2. Attempt to exchange code for session
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);

        if (error) {
          console.error("Error exchanging code:", error.message);
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setErrorMessage(t('auth_link_expired_request_new'));
          } else {
            setErrorMessage(t('auth_link_invalid_try_again'));
          }
          setStatus('error');
          return;
        }

        if (data.session) {
          // Success! Trigger post-auth sync
          await postAuthSync(data.session.user.id);
          
          // Redirect to home or reset password page.
          const next = data.session.user.app_metadata.next_redirect_to;
          if (next) {
            navigate(next, { replace: true });
          } else {
            navigate('/', { replace: true });
          }
          toast.success(t('authentication_successful'));
          setStatus('success');
        } else {
          // Should not happen if no error, but handle unexpected state
          setErrorMessage(t('auth_link_invalid_try_again'));
          setStatus('error');
        }
      } catch (e: any) {
        console.error("Exception during code exchange:", e.message);
        setErrorMessage(t('auth_link_invalid_try_again'));
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [navigate, t, refetchProfile, refetchTasks]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p>{t('processing_authentication')}</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
            <p className="text-lg font-semibold">{t('authentication_successful')}</p>
            <Button asChild className="w-full">
              <Link to="/">{t('return_to_home')}</Link>
            </Button>
          </div>
        );
      case 'error':
        return (
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
            <p className="text-lg font-semibold">{t('authentication_failed')}</p>
            <CardDescription className="text-destructive">{errorMessage}</CardDescription>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">{t('back_to_login')}</Link>
            </Button>
            {/* Resend email button is complex without knowing the user's email, so we omit it for now, 
                relying on the user to go back to ForgotPassword/Login page. */}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t('authentication_callback')}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;