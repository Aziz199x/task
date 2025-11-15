"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from '@/context/SessionContext'; // Import UserProfile type
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { getCapacitorBaseUrl } from '@/utils/capacitor'; // Import the new utility
import { APP_URL } from '@/utils/constants'; // Import APP_URL for explicit web fallback
import { Loader2, Send } from 'lucide-react';

const BACKOFF_DURATIONS = [60, 120, 300]; // seconds

const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserProfile['role']>('technician'); // Default role for self-registration
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  
  // Rate Limit/Cooldown State
  const [cooldown, setCooldown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [lastSentEmail, setLastSentEmail] = useState('');

  // Cooldown Timer Effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(c => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleRateLimitError = useCallback((error: any) => {
    const isRateLimit = error.status === 429 || 
                        error.code === 'over_email_send_rate_limit' || 
                        (typeof error.message === 'string' && error.message.toLowerCase().includes('rate limit'));

    if (isRateLimit) {
      const currentDuration = BACKOFF_DURATIONS[resendAttempts] || BACKOFF_DURATIONS[BACKOFF_DURATIONS.length - 1];
      
      setCooldown(currentDuration);
      setResendAttempts(prev => prev + 1);
      
      toast.error(t('email_rate_limit_cooldown', { seconds: currentDuration }));
      return true;
    }
    return false;
  }, [resendAttempts, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        // The SessionProvider will handle navigation to '/' on successful sign-in
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setLoading(true);
    
    const emailRedirectTo = getCapacitorBaseUrl().startsWith('com.abumiral.workflow') 
      ? getCapacitorBaseUrl() 
      : `${APP_URL}/auth/callback`;

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: lastSentEmail,
        options: { emailRedirectTo },
      });

      if (error) {
        if (!handleRateLimitError(error)) {
          toast.error(error.message);
        }
      } else {
        toast.success(t('confirmation_email_resent_check_inbox'));
        // Reset attempts if successful, but keep cooldown at 0
        setResendAttempts(0);
      }
    } catch (error: any) {
      if (!handleRateLimitError(error)) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);

    if (password !== confirmPassword) {
      toast.error(t('passwords_do_not_match'));
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      toast.error(t('password_too_short'));
      setLoading(false);
      return;
    }

    // Determine the correct redirect URL.
    const emailRedirectTo = getCapacitorBaseUrl().startsWith('com.abumiral.workflow') 
      ? getCapacitorBaseUrl() 
      : `${APP_URL}/auth/callback`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
          },
          emailRedirectTo,
        },
      });

      if (error) {
        // Handle rate limit error first
        if (!handleRateLimitError(error)) {
          // Handle specific error for already registered user
          if (error.message.includes('User already registered')) {
            toast.error(t('user_already_registered_login_instead'));
            setActiveTab('signin'); // Switch to sign-in tab
          } else {
            toast.error(error.message);
          }
        }
      } else if (data.user || (!error && !data.user)) {
        // Success or existing user found (security feature)
        toast.success(t('confirmation_email_sent_check_inbox'));
        
        // Set last sent email and reset cooldown attempts on successful send
        setLastSentEmail(email);
        setResendAttempts(0);
        setCooldown(0); // Ensure cooldown is 0 if successful
        
        // Clear form and switch to sign-in tab
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setRole('technician');
        setActiveTab('signin');
      }
    } catch (error: any) {
      if (!handleRateLimitError(error)) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isSignUpDisabled = loading || cooldown > 0;
  const showResendButton = cooldown === 0 && lastSentEmail.length > 0;

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background relative">
        <div className="absolute top-16 right-4 flex items-center space-x-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md p-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t('welcome_to_task_manager')}</CardTitle>
            <p className="text-muted-foreground">{t('sign_in_or_sign_up')}</p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t('sign_in')}</TabsTrigger>
                <TabsTrigger value="signup">{t('sign_up')}</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signin">{t('email')}</Label>
                    <Input
                      id="email-signin"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('enter_your_email')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin">{t('password_label')}</Label>
                    <Input
                      id="password-signin"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('enter_your_password')}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-end">
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      {t('forgot_password')}
                    </Link>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('loading') : t('sign_in')}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name-signup">{t('first_name')}</Label>
                    <Input
                      id="first-name-signup"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t('enter_your_first_name')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name-signup">{t('last_name')}</Label>
                    <Input
                      id="last-name-signup"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t('enter_your_last_name')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">{t('email')}</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('enter_your_email')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">{t('password_label')}</Label>
                    <Input
                      id="password-signup"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('enter_your_password')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password-signup">{t('confirm_password')}</Label>
                    <Input
                      id="confirm-password-signup"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('confirm_your_password')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-signup">{t('role')}</Label>
                    <Select onValueChange={(value: UserProfile['role']) => setRole(value)} value={role}>
                      <SelectTrigger id="role-signup">
                        <SelectValue placeholder={t('select_role')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technician">{t('technician')}</SelectItem>
                        <SelectItem value="contractor">{t('contractor')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {cooldown > 0 && (
                    <p className="text-sm text-center text-destructive">
                      {t('cooldown_message', { seconds: cooldown })}
                    </p>
                  )}

                  <Button type="submit" className="w-full" disabled={isSignUpDisabled}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t('sign_up')}
                  </Button>

                  {showResendButton && (
                    <Button type="button" variant="outline" className="w-full mt-2" onClick={handleResend} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <><Send className="h-4 w-4 mr-2" /> {t('resend_confirmation_email')}</>}
                    </Button>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Login;