"use client";

import { cn } from "@/lib/utils";
import { useSession } from "@/context/SessionContext";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from "./ui/button";
import { MenuIcon } from "lucide-react";
import StatusBarManager from "./StatusBarManager";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { session, loading } = useSession();
  const location = useLocation();
  const { t } = useTranslation();
  const { isMobile, isClientLoaded } = useIsMobile();

  const requiresAuth = !['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'].includes(location.pathname);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (session && isClientLoaded) {
      setIsSidebarOpen(!isMobile);
    }
  }, [session, isClientLoaded, isMobile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <p>{t('loading_user_session')}</p>
      </div>
    );
  }

  if (requiresAuth && !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>{t('loading_user_session')}</p>
      </div>
    );
  }

  const isNavbarVisible = session && isClientLoaded && isMobile;

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      "bg-background",
      "px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    )}>
      <StatusBarManager />
      {isNavbarVisible && <Navbar />}

      {session && isClientLoaded && !isMobile && (
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      )}

      {session && isClientLoaded && !isMobile && !isSidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 hidden md:flex"
          onClick={() => setIsSidebarOpen(true)}
        >
          <MenuIcon className="h-6 w-6" />
          <span className="sr-only">{t('open_sidebar')}</span>
        </Button>
      )}

      <main className={cn(
        "flex-1 flex flex-col w-full overflow-y-auto",
        // Use safe-area-inset-top for padding to avoid content going under the status bar/notch,
        // especially when the navbar is not visible.
        "pt-[env(safe-area-inset-top)]",
        isNavbarVisible ? "pt-24" : "",
        (!isMobile && isSidebarOpen) ? "lg:ml-64" : "lg:ml-0",
        "bg-background",
        "pb-[calc(1rem+env(safe-area-inset-bottom))]"
      )}>
        <div className="container mx-auto p-4 flex-1">
          {children}
        </div>
      </main>
      <Toaster richColors />
    </div>
  );
}