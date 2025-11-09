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
import useIsDesktop from '@/hooks/use-is-desktop.tsx';
import { useTheme } from 'next-themes';

export function SidebarContent() {
  const { profile, signOut } = useSession();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { refetchTasks } = useTasks();
  const { setOpen } = useSidebar();
  const isDesktop = useIsDesktop();
  const { theme, setTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleRefreshData = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const promise = refetchTasks();
    toast.promise(promise, {
      loading: t('refreshing_data'),
      success: t('data_refreshed_successfully'),
      error: t('failed_to_refresh_data'),
    });
    try {
      await promise;
    } finally {
      setIsRefreshing(false);
    }
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
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center justify-between border-b px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold" onClick={handleClose}>
          <div className="relative flex items-center justify-center h-8 w-8">
            <Settings className="h-full w-full text-orange-500" />
            <Zap className="absolute h-4 w-4 text-yellow-400" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">{t('task_manager')}</span>
        </Link>
        {/* This is the custom close button, kept for mobile view control */}
        <Button variant="ghost" size="icon" onClick={handleClose} className="lg:hidden">
          <X className="h-6 w-6 text-sidebar-foreground" />
          <span className="sr-only">{t('close_sidebar')}</span>
        </Button>
      </div>
      
      <nav className={cn(
        "flex-1 overflow-y-auto p-4 text-sm font-medium",
        !isDesktop && "pb-20" // Add bottom padding to prevent content overlap with the fixed bottom bar (approx 80px)
      )}>
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
            <Button variant="outline" className="w-full btn" onClick={handleRefreshData} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} /> {t('refresh_data')}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Button variant="ghost" onClick={handleSignOut} className="text-destructive hover:bg-destructive/10 btn">
              {t('logout')}
            </Button>
          </div>
        </div>
      )}

      {!isDesktop && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 px-4"
          style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 8px)` }}
        >
          <div className="mx-auto max-w-md">
            <div className="flex items-center justify-between rounded-full border bg-background/70 p-1.5 shadow-lg backdrop-blur-lg">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full btn" onClick={handleRefreshData} aria-label={t('refresh_data')} disabled={isRefreshing}>
                  <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
                </Button>
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-red-500 hover:bg-red-500/10 hover:text-red-500 btn" onClick={handleSignOut} aria-label={t('logout')}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}