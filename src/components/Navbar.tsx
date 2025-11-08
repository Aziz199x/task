"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { ThemeSwitcher } from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import { Menu } from 'lucide-react';
import { useLayout } from '@/context/LayoutContext';
import { useSession } from '@/context/SessionContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import Sidebar from './Sidebar';
import { useTheme } from 'next-themes';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, profile, signOut } = useSession();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isMobile, isClientLoaded } = useIsMobile();
  const { isSidebarOpen, setIsSidebarOpen } = useLayout();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const logoSrc = theme === 'dark' ? '/logo-dark.png' : '/logo-light.png';

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-primary text-primary-foreground fixed w-full z-40 shadow-md h-[calc(6rem+env(safe-area-inset-top))] flex items-end pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between w-full px-4 pb-3">
        <div className="flex items-center">
          {isClientLoaded && isMobile && (
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">{t('open_sidebar')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
              </SheetContent>
            </Sheet>
          )}
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img src={logoSrc} alt="Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold">{t('task_manager')}</h1>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url || "/avatars/01.png"} alt={profile?.first_name || user.email || "User"} />
                    <AvatarFallback>
                      {profile?.first_name ? profile.first_name.charAt(0) : user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.first_name && profile?.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : user.email}
                    </p>
                    {profile?.role && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {t(profile.role)}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  {t('profile_settings')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}