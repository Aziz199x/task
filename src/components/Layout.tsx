"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import { LogOut, LayoutDashboard, ListTodo, Users, UserPlus, Settings } from "lucide-react";
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="AZ Logo" className="h-8 w-8" />
            <h1 className="text-2xl font-bold">{t('task_manager')}</h1>
            {profile && (
              <span className="text-sm font-semibold bg-primary-foreground/20 px-2 py-1 rounded">
                Role: {t(profile.role)}
              </span>
            )}
          </div>
          {session && (
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 gap-2 md:gap-0">
              {profile && (
                <div className="text-sm text-center md:text-left">
                  <p className="font-medium">{profile.first_name || user?.email}</p>
                  <p className="text-xs opacity-80 capitalize">{t(profile.role)}</p>
                </div>
              )}
              {/* Navigation Links */}
              <div className="flex items-center space-x-2 overflow-x-auto whitespace-nowrap py-1">
                <Link to="/">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={isActive('/') ? "bg-primary-foreground text-primary" : "text-primary-foreground hover:bg-primary-foreground/10"}
                  >
                    <ListTodo className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={isActive('/dashboard') ? "bg-primary-foreground text-primary" : "text-primary-foreground hover:bg-primary-foreground/10"}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                  </Button>
                </Link>
                {allowedToCreateAccounts && (
                  <Link to="/create-account">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={isActive('/create-account') ? "bg-primary-foreground text-primary" : "text-primary-foreground hover:bg-primary-foreground/10"}
                    >
                      <UserPlus className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                {allowedToManageUsers && (
                  <Link to="/manage-users">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={isActive('/manage-users') ? "bg-primary-foreground text-primary" : "text-primary-foreground hover:bg-primary-foreground/10"}
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </div>
              {/* Theme, Language, and Logout Buttons */}
              <div className="flex items-center space-x-2">
                <ThemeSwitcher />
                <LanguageSwitcher />
                <Button variant="destructive" size="icon" onClick={signOut}>
                  <LogOut className="h-5 w-5" />
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