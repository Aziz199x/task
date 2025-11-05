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
import { useIsMobile } from '@/hooks/use-mobile'; // Import the hook

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { session, loading } = useSession();
  const location = useLocation();
  const { t } = useTranslation();
  const { isMobile, isClientLoaded } = useIsMobile(); // Use the hook to detect mobile

  // Determine if the current path requires authentication
  const requiresAuth = !['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'].includes(location.pathname);

  // If session is loading or auth is required but no session, show loading or redirect
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <p>{t('loading_user_session')}</p>
      </div>
    );
  }

  // If auth is required and there's no session, the SessionProvider will handle redirect
  // We just ensure the UI doesn't flash unauthenticated content
  if (requiresAuth && !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>{t('loading_user_session')}</p>
      </div>
    );
  }

  // Determine if the Navbar should be visible (only on mobile when authenticated)
  const isNavbarVisible = session && isClientLoaded && isMobile;

  return (
    <div className={cn(
      "min-h-screen flex flex-col"
    )}>
      {/* Navbar is only rendered on mobile (handled by isNavbarVisible logic) */}
      {isNavbarVisible && <Navbar />}
      
      {/* Sidebar is now ONLY rendered inside the Sheet component in Navbar.tsx */}
      
      <main className={cn(
        "flex-1 flex flex-col",
        // Apply top padding if session exists (to clear fixed Navbar)
        session ? "pt-[calc(4rem + env(safe-area-inset-top))]" : "pt-[env(safe-area-inset-top)]",
        // Remove lg:ml-64 margin
      )}>
        {children}
      </main>
      <Toaster richColors />
    </div>
  );
}