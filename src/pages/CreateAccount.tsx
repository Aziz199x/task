"use client";

import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useSession, UserProfile } from "@/context/SessionContext"; // Import UserProfile
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next'; // Import useTranslation

const CreateAccount: React.FC = () => {
  const { profile, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation(); // Initialize useTranslation

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserProfile['role']>("technician"); // Use UserProfile['role'] for all possible roles
  const [loading, setLoading] = useState(false);

  const allowedRolesToAccessPage = ['admin', 'manager', 'supervisor'];
  const isAuthorized = profile && allowedRolesToAccessPage.includes(profile.role);

  if (sessionLoading) {
    return (
      <Layout>
        <div className="text-center py-8">{t('loading_user_session')}</div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="text-center py-8 text-destructive">{t('permission_denied_create_account')}</div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user-with-role', {
        body: { email, password, first_name: firstName, last_name: lastName, role },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(t('account_created_successfully', { firstName, lastName, role: t(role) }));
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setRole("technician"); // Reset to default
    } catch (error: any) {
      console.error("Error creating account:", error.message);
      toast.error(`${t('failed_to_create_account')} ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{t('create_new_user_account')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <Label htmlFor="firstName">{t('first_name')}</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">{t('last_name')}</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="role">{t('role')}</Label>
              <Select onValueChange={(value: UserProfile['role']) => setRole(value)} value={role}>
                <SelectTrigger id="role">
                  <SelectValue placeholder={t('select_role')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('admin')}</SelectItem>
                  <SelectItem value="manager">{t('manager')}</SelectItem>
                  <SelectItem value="supervisor">{t('supervisor')}</SelectItem>
                  <SelectItem value="technician">{t('technician')}</SelectItem>
                  <SelectItem value="contractor">{t('contractor')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('creating') : t('create_account')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default CreateAccount;