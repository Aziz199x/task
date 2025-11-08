"use client";

import React, { useMemo } from "react";
import { useSession } from "@/context/SessionContext";
import { useProfiles, ProfileWithEmail } from "@/hooks/use-profiles"; // Import ProfileWithEmail
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import UserRoleDropdown from "@/components/UserRoleDropdown";
import { User, Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useTasks } from "@/context/TaskContext"; // Import useTasks

const ManageUsers: React.FC = () => {
  const { profile: currentUserProfile, loading: sessionLoading } = useSession();
  const { profiles, loading: profilesLoading, error: profilesError } = useProfiles();
  const { tasks } = useTasks(); // Get tasks from TaskContext
  const { t } = useTranslation();

  const allowedRoles = ['admin', 'manager', 'supervisor'];
  const isAuthorized = currentUserProfile && allowedRoles.includes(currentUserProfile.role);

  // Helper function to get the email prefix
  const getEmailPrefix = (email: string | null) => {
    if (!email) return t('id');
    return email.split('@')[0];
  };

  // Calculate performance rate for each profile
  const profilesWithPerformance = useMemo(() => {
    return profiles.map(profile => {
      const assignedTasks = tasks.filter(task => task.assignee_id === profile.id);
      const completedTasks = assignedTasks.filter(task => task.status === 'completed');
      const performanceRate = assignedTasks.length > 0
        ? ((completedTasks.length / assignedTasks.length) * 100).toFixed(0) + '%'
        : 'N/A';
      return { ...profile, performanceRate };
    });
  }, [profiles, tasks]);

  if (sessionLoading || profilesLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-lg text-muted-foreground">{t('loading_user_data')}</p>
        <div className="space-y-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="text-center py-8 text-destructive">{t('permission_denied_manage_roles')}</div>
    );
  }

  if (profilesError) {
    return (
      <div className="text-center py-8 text-destructive">{t('error_loading_user_profiles')} {profilesError}</div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6" /> {t('manage_user_roles')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('id')}</TableHead> {/* Using 'id' for the email prefix */}
              <TableHead>{t('current_role')}</TableHead>
              <TableHead>{t('performance_rate')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profilesWithPerformance.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{profile.first_name} {profile.last_name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {getEmailPrefix(profile.email)}
                </TableCell>
                <TableCell className="capitalize">{t(profile.role)}</TableCell>
                <TableCell>{profile.performanceRate}</TableCell>
                <TableCell className="text-right">
                  <UserRoleDropdown profile={profile} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ManageUsers;