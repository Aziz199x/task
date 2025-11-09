"use client";

import { useState } from 'react';
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
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

    // Use getCapacitorBaseUrl for the redirect, ensuring it works on native and web
    const emailRedirectTo = getCapacitorBaseUrl();

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
          emailRedirectTo, // Use custom redirect for verification
        },
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        toast.success(t('account_created_successfully_check_email'));
        // Optionally, redirect to a page informing them to check email
        // For now, we'll just clear the form and switch to sign-in tab
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setRole('technician');
        setActiveTab('signin');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('creating') : t('sign_up')}
                  </Button>
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