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
import { useLayout } from '@/context/LayoutContext';
import { Button } from "./ui/button";
import { MenuIcon } from "lucide-react";
import StatusBarManager from "./StatusBarManager";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { session, loading } = useSession();
  const { t } = useTranslation();
  const location = useLocation();
  const { isMobile, isClientLoaded } = useIsMobile();
  const { isSidebarOpen, setIsSidebarOpen } = useLayout();

  const requiresAuth = !['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'].includes(location.pathname);

  useEffect(() => {
    if (session && isClientLoaded) {
      setIsSidebarOpen(!isMobile);
    }
  }, [session, isClientLoaded, isMobile, setIsSidebarOpen]);

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

  const isNavbarVisible = session && isClientLoaded;

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      "bg-background"
    )}>
      <StatusBarManager />
      {isNavbarVisible && <Navbar />}

      {session && isClientLoaded && (
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      )}

      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isSidebarOpen && !isMobile ? "lg:ml-64" : "lg:ml-0",
        "pt-24",
        "pb-safe-bottom"
      )}>
        <div className="container mx-auto p-4 flex-1">
          {children}
        </div>
      </main>
      <Toaster richColors />
    </div>
  );
}