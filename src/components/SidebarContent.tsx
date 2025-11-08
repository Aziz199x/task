"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSession } from '@/context/SessionContext';
import { useTranslation } from 'react-i18next';
import { Home, LayoutDashboard, Users, Settings, Wrench, BarChart3, RefreshCw, X, Zap, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeSwitcher } from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import { useTasks } from '@/context/TaskContext';
import { toast } from 'sonner';
import { useSidebar } from '@/state/useSidebar';
import useIsDesktop from '@/hooks/use-is-desktop';

export function SidebarContent() {
  const { profile, signOut } = useSession();
  const { t } = useTranslation();
  const location = useLocation();
  const { refetchTasks } = useTasks();
  const { setOpen } = useSidebar();
  const isDesktop = useIsDesktop();

  const handleClose = () => {
    setOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleRefreshData = async () => {
    toast.info(t('refreshing_data'));
    await refetchTasks();
    toast.success(t('data_refreshed_successfully'));
  };

  const navigationItems = [
    { name: t('home'), href: '/', icon: Home, roles: ['admin', 'manager', 'supervisor', 'technician', 'contractor'] },
    { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'supervisor'] },
    { name: t('technician_tasks'), href: '/technician-tasks', icon: Wrench, roles: ['admin', 'manager', 'supervisor'] },
    { name: t('manage_users'), href: '/manage-users', icon: Users, roles: ['admin', 'manager', 'supervisor'] },
    { name: t('create_new_user_account'), href: '/create-account', icon: Users, roles: ['admin', 'manager', 'supervisor'] },
    { name: t('diagnostics'), href: '/diagnostics', icon: BarChart3, roles: ['admin'] },
    { name: t('settings'), href: '/settings', icon: Settings, roles: ['admin', 'manager', 'supervisor', 'technician', 'contractor'] },
  ];

  return (
    <>
      <div className="flex h-16 items-center justify-between border-b px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold" onClick={handleClose}>
          <div className="relative flex items-center justify-center h-8 w-8">
            <Settings className="h-full w-full text-orange-500" />
            <Zap className="absolute h-4 w-4 text-yellow-400" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">{t('task_manager')}</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleClose} className="lg:hidden">
          <X className="h-6 w-6 text-sidebar-foreground" />
          <span className="sr-only">{t('close_sidebar')}</span>
        </Button>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 text-sm font-medium">
        <ul className="grid gap-2">
          {navigationItems.map((item) => {
            if (profile && item.roles.includes(profile.role)) {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground"
                    )}
                    onClick={handleClose}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </li>
              );
            }
            return null;
          })}
        </ul>
      </nav>
      
      {isDesktop && (
        <div className="mt-auto border-t p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" className="w-full" onClick={handleRefreshData}>
              <RefreshCw className="h-4 w-4 mr-2" /> {t('refresh_data')}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Button variant="ghost" onClick={handleSignOut} className="text-destructive hover:bg-destructive/10">
              {t('logout')}
            </Button>
          </div>
        </div>
      )}

      {!isDesktop && (
        <div
          className="fixed left-0 right-0 z-40"
          style={{ bottom: `calc(env(safe-area-inset-bottom) + 20px)` }}
        >
          <div className="mx-auto max-w-screen-sm px-4">
            <div className="flex items-center justify-around rounded-2xl border border-white/10 bg-black/50 p-2 backdrop-blur-md">
              <Button variant="ghost" size="sm" onClick={handleRefreshData} aria-label={t('refresh_data')}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <ThemeSwitcher />
              <LanguageSwitcher />
              <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label={t('logout')}>
                <LogOut className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}