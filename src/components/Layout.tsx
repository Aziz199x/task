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
  const { isMobile, isClientLoaded } = useIsMobile(); // Use the hook

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
      "min-h-screen flex flex-col",
      "bg-background" 
    )}>
      {/* Navbar is only rendered on mobile (handled by isNavbarVisible logic) */}
      {isNavbarVisible && <Navbar />}
      
      {/* Render persistent sidebar only on desktop (lg breakpoint and above) */}
      {session && isClientLoaded && !isMobile && <Sidebar isOpen={true} setIsOpen={() => {}} />} 
      
      <main className={cn(
        "flex-1 flex flex-col w-full overflow-y-auto", // Added overflow-y-auto for scrolling
        // Apply top padding:
        // - when navbar is visible we add 4rem (navbar height) here and include the safe-area inset inside the Navbar itself
        // - otherwise just add the safe-area inset so content isn't under the system status bar
        isNavbarVisible ? "pt-16" : "pt-[env(safe-area-inset-top)]",
        // Apply left margin only on large screens where the sidebar is visible
        "lg:ml-64",
        // Explicitly set background for main content area
        "bg-background",
        // Ensure we add bottom safe-area padding so Android navigation/gesture bar doesn't overlap bottom UI
        // and add a small extra gap so interactive buttons are comfortably above system UI.
        "pb-[env(safe-area-inset-bottom)]"
      )}>
        {/* Add padding to the content itself, inside the main tag */}
        <div className="container mx-auto p-4 flex-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </main>
      <Toaster richColors />
    </div>
  );
}