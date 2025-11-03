"use client";

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import { LogOut, LayoutDashboard, ListTodo, UserPlus, Settings, User, RefreshCw, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from 'react-i18next';
import UserTaskSummaryBar from "./UserTaskSummaryBar";
import { ThemeSwitcher } from "./ThemeSwitcher";
import useIdleTimeout from "@/hooks/use-idle-timeout";
import { toast } from "sonner";
import { useTasks } from "@/context/TaskContext";
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"; // Import Sheet components

interface LayoutProps {
  children: React.ReactNode;
}

const FOUR_HOURS_IN_SECONDS = 4 * 60 * 60;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { session, user, profile, signOut } = useSession();
  const { refetchTasks, loading: tasksLoading } = useTasks();
  const { t } = useTranslation();
  const location = useLocation();
  const { isMobile } = useIsMobile(); // Use the hook

  // Sign out user after 4 hours of inactivity
  useIdleTimeout(signOut, FOUR_HOURS_IN_SECONDS);

  const handleSignOut = () => {
    toast.success(t('signed_out_successfully'));
    signOut();
  };

  const handleRefresh = async () => {
    toast.info(t('refreshing_data'));
    await refetchTasks();
    toast.success(t('data_refreshed_successfully'));
  };

  const allowedToCreateAccounts = profile && ['admin', 'manager', 'supervisor'].includes(profile.role);
  const allowedToManageUsers = profile && ['admin', 'manager', 'supervisor'].includes(profile.role);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
    <Link to={to} className="w-full">
      <Button 
        variant={isActive(to) ? "secondary" : "ghost"} 
        className="w-full justify-start"
        onClick={isMobile ? () => {} : undefined} // Close sheet on click if mobile
      >
        {icon} <span className="ml-2">{label}</span>
      </Button>
    </Link>
  );

  const DesktopNav = (
    <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
      {/* Manual Refresh Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleRefresh}
        disabled={tasksLoading}
        className="text-primary-foreground hover:bg-primary-foreground/10"
        title={t('refresh_data')}
      >
        <RefreshCw className={`h-4 w-4 ${tasksLoading ? 'animate-spin' : ''}`} />
      </Button>

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
      <Link to="/settings">
        <Button 
          variant="ghost" 
          size="icon" 
          className={isActive('/settings') ? "bg-primary-foreground text-primary" : "text-primary-foreground hover:bg-primary-foreground/10"}
          title={t('settings')}
        >
          <User className="h-4 w-4" />
        </Button>
      </Link>
      <ThemeSwitcher />
      <LanguageSwitcher />
      <Button variant="destructive" size="icon" onClick={handleSignOut} title={t('logout')}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );

  const MobileSheet = (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[250px] sm:w-[300px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-xl font-bold">{t('task_manager')}</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-4 flex-grow overflow-y-auto">
          {/* User Info */}
          {profile && (
            <div className="pb-4 border-b">
              <p className="font-medium truncate">{profile.first_name} {profile.last_name || user?.email}</p>
              <p className="text-sm text-muted-foreground capitalize">{t(profile.role)}</p>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            <NavLink to="/" icon={<ListTodo className="h-4 w-4" />} label={t('task_list')} />
            <NavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label={t('dashboard')} />
            {allowedToCreateAccounts && (
              <NavLink to="/create-account" icon={<UserPlus className="h-4 w-4" />} label={t('create_new_user_account')} />
            )}
            {allowedToManageUsers && (
              <NavLink to="/manage-users" icon={<Settings className="h-4 w-4" />} label={t('manage_user_roles')} />
            )}
            <NavLink to="/settings" icon={<User className="h-4 w-4" />} label={t('settings')} />
          </nav>
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('language')}</span>
            <LanguageSwitcher />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('theme')}</span>
            <ThemeSwitcher />
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleRefresh}
            disabled={tasksLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${tasksLoading ? 'animate-spin' : ''}`} /> {t('refresh_data')}
          </Button>
          <Button variant="destructive" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> {t('logout')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="container mx-auto flex justify-between items-center gap-4">
          {/* Left Side: Logo and Title */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {session && isMobile && MobileSheet}
            <img 
              src="/logo-light.png" 
              alt="AbuMiral Logo" 
              className="h-8 w-8 dark:hidden" 
            />
            <img 
              src="/logo-dark.png" 
              alt="AbuMiral Logo" 
              className="h-8 w-8 hidden dark:block" 
            />
            <h1 className="text-xl font-bold md:text-2xl">{t('task_manager')}</h1>
          </div>

          {/* Right Side: Navigation/Actions */}
          {session && (
            <div className="hidden md:flex items-center gap-4 flex-wrap justify-end min-w-0">
              {/* User Info (Desktop Only) */}
              {profile && (
                <div className="text-sm text-right flex-shrink-0 min-w-[100px]">
                  <p className="font-medium truncate">{profile.first_name} {profile.last_name || user?.email}</p>
                  <p className="text-xs opacity-80 capitalize">{t(profile.role)}</p>
                </div>
              )}
              {DesktopNav}
            </div>
          )}
          
          {/* Mobile Actions (Only Sign Out, Refresh, Theme, Language) */}
          {session && isMobile && (
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefresh}
                disabled={tasksLoading}
                className="text-primary-foreground hover:bg-primary-foreground/10"
                title={t('refresh_data')}
              >
                <RefreshCw className={`h-4 w-4 ${tasksLoading ? 'animate-spin' : ''}`} />
              </Button>
              <ThemeSwitcher />
              <Button variant="destructive" size="icon" onClick={handleSignOut} title={t('logout')}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>
      {session && (
        <div className="sticky top-[calc(4.25rem+env(safe-area-inset-top))] z-40">
          <UserTaskSummaryBar />
        </div>
      )}
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;