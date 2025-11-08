"use client";

import React from 'react';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/state/useSidebar';
import { useSession } from '@/context/SessionContext';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import useIsDesktop from '@/hooks/use-is-desktop';
import { useTheme } from 'next-themes';

export function Header() {
  const { user, profile, signOut } = useSession();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toggle } = useSidebar();
  const isDesktop = useIsDesktop();
  const { theme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const logoSrc = theme === 'dark' ? '/logo-dark.png' : '/logo-light.png';

  if (!user) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm" style={{ paddingTop: `env(safe-area-inset-top)` }}>
      <div className="flex items-center">
        {!isDesktop && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={toggle}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">{t('open_sidebar')}</span>
          </Button>
        )}
         <Link to="/" className="flex items-center gap-2 font-semibold lg:hidden">
            <img src={logoSrc} alt="Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold">{t('task_manager')}</h1>
          </Link>
      </div>
      <div className="flex items-center space-x-4">
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
      </div>
    </header>
  );
}