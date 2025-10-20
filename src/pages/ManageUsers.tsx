"use client";

import React from "react";
import Layout from "@/components/Layout";
import { useSession } from "@/context/SessionContext";
import { useProfiles } from "@/hooks/use-profiles"; // New hook to fetch all profiles
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import UserRoleDropdown from "@/components/UserRoleDropdown"; // New component
import { User, Loader2 } from "lucide-react";

const ManageUsers: React.FC = () => {
  const { profile: currentUserProfile, loading: sessionLoading } = useSession();
  const { profiles, loading: profilesLoading, error: profilesError } = useProfiles();

  const allowedRoles = ['admin', 'manager', 'supervisor'];
  const isAuthorized = currentUserProfile && allowedRoles.includes(currentUserProfile.role);

  if (sessionLoading || profilesLoading) {
    return (
      <Layout>
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading user data...</p>
          <div className="space-y-4 mt-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="text-center py-8 text-destructive">You do not have permission to manage user roles.</div>
      </Layout>
    );
  }

  if (profilesError) {
    return (
      <Layout>
        <div className="text-center py-8 text-destructive">Error loading user profiles: {profilesError}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" /> Manage User Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.first_name} {profile.last_name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{profile.id}</TableCell>
                  <TableCell className="capitalize">{profile.role}</TableCell>
                  <TableCell className="text-right">
                    <UserRoleDropdown profile={profile} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default ManageUsers;