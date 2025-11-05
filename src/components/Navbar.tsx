import React from 'react';
import { Button } from './ui/button';
import { MenuIcon } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
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
import Sidebar from './Sidebar'; // Assuming Sidebar is also in components

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const { user, profile, signOut } = useSession();
  const { t } = useTranslation();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md fixed w-full z-40 lg:ml-64 lg:w-[calc(100%-16rem)]">
      <div className="flex items-center">
        {/* Mobile sidebar toggle */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="mr-2">
              <MenuIcon className="h-6 w-6" />
              <span className="sr-only">{t('toggle_sidebar')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar isOpen={true} toggleSidebar={() => {}} /> {/* Sidebar will manage its own state */}
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-bold">{t('task_manager')}</h1>
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
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                {t('profile_settings')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}