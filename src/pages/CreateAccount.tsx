"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSession, UserProfile } from "@/context/SessionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';

const allRoles: UserProfile['role'][] = ['admin', 'manager', 'supervisor', 'technician', 'contractor'];

// Define role hierarchy for permission checks
const roleHierarchy = {
  'admin': 4,
  'manager': 3,
  'supervisor': 2,
  'technician': 1,
  'contractor': 0,
};

const CreateAccount: React.FC = () => {
  const { profile, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserProfile['role']>("technician");
  const [loading, setLoading] = useState(false);

  // Determine which roles the current user can create based on the new hierarchy
  const availableRoles = useMemo(() => {
    if (!profile) return [];
    const currentUserRoleLevel = roleHierarchy[profile.role];

    return allRoles.filter(roleOption => {
      const targetRoleLevel = roleHierarchy[roleOption];
      // A user can create accounts for roles that are strictly lower than their own,
      // or equal if they are an admin (admin can create other admins).
      // For this specific request, managers/supervisors can create technicians/contractors.
      // Let's simplify: a user can create roles with a hierarchy level less than or equal to their own,
      // but not 'admin' unless they are an admin.
      if (profile.role === 'admin') {
        return true; // Admin can create any role
      } else if (profile.role === 'manager') {
        return ['supervisor', 'technician', 'contractor'].includes(roleOption);
      } else if (profile.role === 'supervisor') {
        return ['technician', 'contractor'].includes(roleOption);
      }
      return false; // Other roles cannot create users
    });
  }, [profile]);

  // Adjust the selected role if it's not available
  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.includes(role)) {
      setRole(availableRoles[0]);
    } else if (availableRoles.length === 0) {
      setRole("technician"); // Default if no roles are available (shouldn't happen if authorized)
    }
  }, [availableRoles, role]);

  const allowedRolesToAccessPage = ['admin', 'manager', 'supervisor'];
  const isAuthorized = profile && allowedRolesToAccessPage.includes(profile.role);

  if (sessionLoading) {
    return (
      <div className="text-center py-8">{t('loading_user_session')}</div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="text-center py-8 text-destructive">{t('permission_denied_create_account')}</div>
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
        // This handles network errors or function invocation failures
        throw new Error(error.message);
      }
      
      // Check for errors returned within the Edge Function's JSON response body
      if (data && data.error) {
        throw new Error(data.error);
      }

      toast.success(t('accountcreatedsuccessfully', { firstName, lastName, role: t(role) }));
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setRole(availableRoles.length > 0 ? availableRoles[0] : "technician"); // Reset to a valid default
    } catch (error: any) {
      console.error("Error creating account:", error.message);
      // Attempt to parse JSON error message if it looks like one
      let errorMessage = error.message;
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.error) {
          errorMessage = errorObj.error;
        }
      } catch (e) {
        // Ignore if not JSON
      }
      toast.error(`${t('failedtocreateaccount')} ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">{t('createnewuseraccount')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
            <Label htmlFor="email" className="md:text-end">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="md:col-span-3"
            />
          </div>
          <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
            <Label htmlFor="password" className="md:text-end">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="md:col-span-3"
            />
          </div>
          <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
            <Label htmlFor="firstName" className="md:text-end">{t('firstname')}</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              required
              className="md:col-span-3"
            />
          </div>
          <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
            <Label htmlFor="lastName" className="md:text-end">{t('lastname')}</Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              required
              className="md:col-span-3"
            />
          </div>
          <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
            <Label htmlFor="role" className="md:text-end">{t('role')}</Label>
            <Select onValueChange={(value: UserProfile['role']) => setRole(value)} value={role} disabled={availableRoles.length === 0}>
              <SelectTrigger id="role" className="md:col-span-3">
                <SelectValue placeholder={t('selectrole')} />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((roleOption) => (
                  <SelectItem key={roleOption} value={roleOption}>
                    {t(roleOption)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading || availableRoles.length === 0}>
            {loading ? t('creating') : t('createaccount')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateAccount;