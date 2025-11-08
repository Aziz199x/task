"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSession } from '@/context/SessionContext';
import { useTranslation } from 'react-i18next';
import { Home, LayoutDashboard, Users, Settings, Wrench, BarChart3, RefreshCw, X } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeSwitcher } from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import { useTasks } from '@/context/TaskContext';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen?: (isOpen: boolean) => void; // Made optional
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { profile, signOut } = useSession();
  const { t } = useTranslation();
  const location = useLocation();
  const { refetchTasks } = useTasks();
  const { theme } = useTheme();

  const handleClose = () => {
    if (setIsOpen) {
      setIsOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    // No need to navigate, SessionProvider will handle redirect to /login
  };

  const handleRefreshData = async () => {
    toast.info(t('refreshing_data'));
    await refetchTasks();
    toast.success(t('data_refreshed_successfully'));
  };

  const navigationItems = [
    {
      name: t('home'),
      href: '/',
      icon: Home,
      roles: ['admin', 'manager', 'supervisor', 'technician', 'contractor'],
    },
    {
      name: t('dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'supervisor'],
    },
    {
      name: t('technician_tasks'),
      href: '/technician-tasks',
      icon: Wrench,
      roles: ['admin', 'manager', 'supervisor'],
    },
    {
      name: t('manage_users'),
      href: '/manage-users',
      icon: Users,
      roles: ['admin', 'manager', 'supervisor'],
    },
    {
      name: t('create_new_user_account'),
      href: '/create-account',
      icon: Users,
      roles: ['admin', 'manager', 'supervisor'],
    },
    {
      name: t('diagnostics'),
      href: '/diagnostics',
      icon: BarChart3,
      roles: ['admin'],
    },
    {
      name: t('settings'),
      href: '/settings',
      icon: Settings,
      roles: ['admin', 'manager', 'supervisor', 'technician', 'contractor'],
    },
  ];

  const logoSrc = theme === 'dark' ? '/logo-dark.png' : '/logo-light.png';

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-sidebar transition-transform duration-300 ease-in-out",
        isOpen ? 'translate-x-0' : '-translate-x-full',
        "lg:translate-x-0" // Re-enable persistent visibility on large screens
      )}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {/* Header with padding to avoid status bar overlap */}
      <div className="flex h-16 items-center justify-between border-b px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold" onClick={handleClose}>
          <img src={logoSrc} alt="Logo" className="h-8 w-auto" />
          <span className="text-lg font-bold text-sidebar-foreground">{t('task_manager')}</span>
        </Link>
        {/* Hide close button on desktop */}
        <Button variant="ghost" size="icon" onClick={handleClose} className="lg:hidden">
          <X className="h-6 w-6 text-sidebar-foreground" />
          <span className="sr-only">{t('close_sidebar')}</span>
        </Button>
      </div>
      
      {/* Navigation menu */}
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
      
      {/* Bottom controls with extra padding to avoid Android gesture bar */}
      <div className="mt-auto border-t p-4 pb-6">
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
    </aside>
  );
};

export default Sidebar;