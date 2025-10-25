"use client";

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import { LogOut, LayoutDashboard, ListTodo, UserPlus, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from 'react-i18next';
import UserTaskSummaryBar from "./UserTaskSummaryBar";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { session, user, profile, signOut } = useSession();
  const { t } = useTranslation();
  const location = useLocation();

  const allowedToCreateAccounts = profile && ['admin', 'manager', 'supervisor'].includes(profile.role);
  const allowedToManageUsers = profile && ['admin', 'manager', 'supervisor'].includes(profile.role);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex flex-wrap justify-between items-center gap-4">
          {/* App Logo and Title (Always visible) */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <img src="/logo.png" alt="AbuMiral Logo" className="h-8 w-8" />
            <h1 className="text-2xl font-bold">{t('task_manager')}</h1>
          </div>

          {session && (
            <div className="flex items-center gap-2 flex-wrap justify-end min-w-0">
              {/* User Info (Name and Role) */}
              {profile && (
                <div className="text-sm text-right md:text-left flex-shrink-0 min-w-[100px]">
                  <p className="font-medium truncate">{profile.first_name} {profile.last_name || user?.email}</p>
                  <p className="text-xs opacity-80 capitalize">{t(profile.role)}</p>
                </div>
              )}

              {/* Navigation and Utility Buttons */}
              <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                <Link to="/">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={isActive('/') ? "bg-primary-foreground text-primary" : "text-primary-foreground hover:bg-primary-foreground/10"}
                    title={t('task_list')}
                  >
                    <ListTodo className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={isActive('/dashboard') ? "bg-primary-foreground text-primary" : "text-primary-foreground hover:bg-primary-foreground/10"}
                    title={t('dashboard')}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                  </Button>
                </Link>
                {allowedToCreateAccounts && (
                  <Link to="/create-account">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={isActive('/create-account') ? "bg-primary-foreground text-primary" : "text-primary-foreground hover:bg-primary-foreground/10"}
                      title={t('create_new_user_account')}
                  >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {allowedToManageUsers && (
                  <Link to="/manage-users">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={isActive('/manage-users') ? "bg-primary-foreground text-primary" : "text-primary-foreground hover:bg-primary-foreground/10"}
                      title={t('manage_user_roles')}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <ThemeSwitcher />
                <LanguageSwitcher />
                <Button variant="destructive" size="icon" onClick={signOut} title={t('logout')}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>
      <UserTaskSummaryBar />
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;