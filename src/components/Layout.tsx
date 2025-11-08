"use client";

import { cn } from "@/lib/utils";
import { useSession } from "@/context/SessionContext";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useTheme } from "next-themes";
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { session, loading } = useSession();
  const location = useLocation();
  const { t } = useTranslation();
  const { isMobile, isClientLoaded } = useIsMobile();

  const requiresAuth = !['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'].includes(location.pathname);

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
      "bg-background" 
    )}>
      {isNavbarVisible && <Navbar />}
      
      {session && isClientLoaded && !isMobile && <Sidebar isOpen={true} setIsOpen={() => {}} />} 
      
      <main className={cn(
        "flex-1 flex flex-col w-full overflow-y-auto",
        // Only add top padding for mobile navbar, no safe-area-inset-top needed
        isNavbarVisible ? "pt-24" : "",
        "lg:ml-64",
        "bg-background",
        // Add extra bottom padding to account for Android gesture navigation
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