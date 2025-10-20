"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from '@/context/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/context/SessionContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation

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
  const { t } = useTranslation(); // Initialize useTranslation
  const [currentRole, setCurrentRole] = React.useState<UserProfile['role']>(profile.role);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleRoleChange = async (newRole: UserProfile['role']) => {
    if (!currentUserProfile) {
      toast.error(t('you_must_be_logged_in_to_change_roles'));
      return;
    }

    // Prevent users from changing their own role
    if (profile.id === currentUserProfile.id) {
      toast.error(t('you_cannot_change_your_own_role'));
      return;
    }

    // Prevent users from changing roles of users with higher or equal authority
    if (roleHierarchy[currentUserProfile.role] <= roleHierarchy[profile.role]) {
      toast.error(t('insufficient_authority_change_role'));
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    if (error) {
      console.error("Error updating user role:", error.message);
      toast.error(`${t('failed_to_update_role')} ${error.message}`);
    } else {
      setCurrentRole(newRole);
      toast.success(t('role_updated_successfully', { name: profile.first_name || profile.id, role: t(newRole) }));
    }
    setIsUpdating(false);
  };

  const roles: UserProfile['role'][] = ['admin', 'manager', 'supervisor', 'technician', 'contractor'];

  return (
    <Select onValueChange={handleRoleChange} value={currentRole} disabled={isUpdating || !currentUserProfile || profile.id === currentUserProfile.id || roleHierarchy[currentUserProfile.role] <= roleHierarchy[profile.role]}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t('select_role_dropdown')} />
      </SelectTrigger>
      <SelectContent>
        {roles.map((roleOption) => (
          <SelectItem
            key={roleOption}
            value={roleOption}
            disabled={
              !currentUserProfile ||
              profile.id === currentUserProfile.id ||
              roleHierarchy[currentUserProfile.role] <= roleHierarchy[roleOption] ||
              (roleHierarchy[currentUserProfile.role] <= roleHierarchy[profile.role] && roleOption !== currentRole)
            }
          >
            {t(roleOption)} {/* Translate role option */}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default UserRoleDropdown;