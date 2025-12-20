"use client";

import React from 'react';
import { useResponsive } from "@/hooks/use-responsive";
import { useScrolled } from "@/hooks/use-scrolled";
import { useSidebar } from '@/state/useSidebar';
import { useSession } from '@/context/SessionContext';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Menu, Settings, Zap, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// Helper component for the right slot content (User Dropdown)
const UserDropdown = () => {
  const { user, profile, signOut } = useSession();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
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
  );
};


export function Header() {
  const { t } = useTranslation();
  const { toggle } = useSidebar();
  const screen = useResponsive();
  const scrolled = useScrolled(6); // Use 6px threshold
  const { theme } = useTheme();

  // Density & sizing per screen
  const height = screen === "desktop" ? 72 : screen === "tablet" ? 64 : 56; // px (content area)
  const logoSize = screen === "desktop" ? 28 : screen === "tablet" ? 26 : 24;
  const titleSize = screen === "desktop" ? "text-2xl" : screen === "tablet" ? "text-xl" : "text-lg";

  const logoSrc = theme === 'dark' ? '/logo-dark.png' : '/logo-light.png';
  const isDesktop = screen === 'desktop';

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-20 w-full bg-background/95 backdrop-blur-sm transition-all duration-200",
        scrolled ? "shadow-md border-b" : "border-b-transparent", // Map header-elevated to shadow/border
      )}
      style={{ paddingTop: `env(safe-area-inset-top)` }} // Use inline style for safe area padding
    >
      <div
        className="mx-auto flex w-full items-center justify-between px-3 sm:px-4 lg:px-6" // Added justify-between
        style={{ height: `${height}px` }}
      >
        {/* Left-aligned group: Burger (if mobile) and Logo */}
        <div className="flex items-center">
          {!isDesktop && (
            <Button
              aria-label={t('toggle_sidebar')}
              onClick={toggle}
              variant="ghost"
              size="icon"
              className="mr-2 h-10 w-10"
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}

          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img
              src={logoSrc}
              alt={t('task_manager')}
              width={logoSize}
              height={logoSize}
              className="select-none"
            />
            <h1 className={cn("truncate font-semibold", titleSize)}>{t('task_manager')}</h1>
          </Link>
        </div>

        {/* Right actions slot (pushed to the end of the line by justify-between) */}
        <div className="flex items-center gap-1">
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}