import { cn } from "@/lib/utils";
import { useSession } from "@/context/SessionContext";
import { useLocation } from "react-router-dom"; // Changed from 'next/navigation'
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
  const location = useLocation(); // Changed from usePathname
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]); // Use location.pathname

  // Determine if the current path requires authentication
  const requiresAuth = !['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'].includes(location.pathname); // Use location.pathname

  // If session is loading or auth is required but no session, show loading or redirect
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
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
      "min-h-screen flex flex-col",
      theme === 'dark' ? 'dark' : ''
    )}>
      {session && <Navbar toggleSidebar={toggleSidebar} />}
      {session && <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />}
      <main className={cn(
        "flex-1 flex flex-col",
        session ? "lg:ml-64" : "", // Adjust for sidebar width when session exists
        "pt-[env(safe-area-inset-top)]" // Add padding to account for safe area insets
      )}>
        {children}
      </main>
      <Toaster richColors />
    </div>
  );
}