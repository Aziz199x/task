"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from '@/context/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/context/SessionContext';

interface UserRoleDropdownProps {
  profile: UserProfile;
}

const roleHierarchy = {
  'admin': 4,
  'manager': 3,
  'supervisor': 2,
  'technician': 1,
  'contractor': 0,
};

const UserRoleDropdown: React.FC<UserRoleDropdownProps> = ({ profile }) => {
  const { profile: currentUserProfile } = useSession();
  const [currentRole, setCurrentRole] = React.useState<UserProfile['role']>(profile.role);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleRoleChange = async (newRole: UserProfile['role']) => {
    if (!currentUserProfile) {
      toast.error("You must be logged in to change roles.");
      return;
    }

    // Prevent users from changing their own role
    if (profile.id === currentUserProfile.id) {
      toast.error("You cannot change your own role.");
      return;
    }

    // Prevent users from changing roles of users with higher or equal authority
    if (roleHierarchy[currentUserProfile.role] <= roleHierarchy[profile.role]) {
      toast.error("You do not have sufficient authority to change this user's role.");
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    if (error) {
      console.error("Error updating user role:", error.message);
      toast.error("Failed to update role: " + error.message);
    } else {
      setCurrentRole(newRole);
      toast.success(`Role for ${profile.first_name || profile.id} updated to ${newRole}.`);
    }
    setIsUpdating(false);
  };

  const roles: UserProfile['role'][] = ['admin', 'manager', 'supervisor', 'technician', 'contractor'];

  return (
    <Select onValueChange={handleRoleChange} value={currentRole} disabled={isUpdating || !currentUserProfile || profile.id === currentUserProfile.id || roleHierarchy[currentUserProfile.role] <= roleHierarchy[profile.role]}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((roleOption) => (
          <SelectItem
            key={roleOption}
            value={roleOption}
            disabled={
              !currentUserProfile || // If no current user profile, disable all
              profile.id === currentUserProfile.id || // Cannot change own role
              roleHierarchy[currentUserProfile.role] <= roleHierarchy[roleOption] || // Cannot assign a role higher than or equal to current user's own role
              (roleHierarchy[currentUserProfile.role] <= roleHierarchy[profile.role] && roleOption !== currentRole) // Cannot change role of someone with equal/higher authority
            }
          >
            {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default UserRoleDropdown;