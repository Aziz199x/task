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

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { session, loading } = useSession();
  const location = useLocation();
  const { t } = useTranslation();
  // The desktop sidebar is always open on large screens, so no state is needed here for its toggle.

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

  return (
    <div className={cn(
      "min-h-screen flex flex-col"
    )}>
      {session && <Navbar />}
      {/* The desktop sidebar is always open, so isOpen is true. toggleSidebar is not used for desktop. */}
      {session && <Sidebar isOpen={true} toggleSidebar={() => {}} />} 
      <main className={cn(
        "flex-1 flex flex-col",
        // Apply left margin for sidebar on large screens, and top padding for fixed navbar + safe area
        session ? "lg:ml-64 pt-[calc(4rem + env(safe-area-inset-top))]" : "pt-[env(safe-area-inset-top)]" 
      )}>
        {children}
      </main>
      <Toaster richColors />
    </div>
  );
}