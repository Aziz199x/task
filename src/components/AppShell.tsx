"use client";

import { useEffect } from "react";
import { useSidebar } from "@/state/useSidebar";
import useIsDesktop from "@/hooks/use-is-desktop";
import { SidebarContent } from "./SidebarContent";
import { Header } from "./Header";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "@/context/SessionContext";
import { useTranslation } from "react-i18next";
import StatusBarManager from "./StatusBarManager";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSidebar();
  const isDesktop = useIsDesktop();
  const { session, loading } = useSession();
  const { t } = useTranslation();

  useEffect(() => {
    if (isDesktop) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [isDesktop, setOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <p>{t('loading_user_session')}</p>
      </div>
    );
  }

  if (!session) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>{t('loading_user_session')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StatusBarManager />

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r bg-sidebar lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {!isDesktop && (
        <>
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-sidebar transition-transform duration-300 ease-in-out",
              open ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <SidebarContent />
          </div>
          {open && (
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setOpen(false)}
            />
          )}
        </>
      )}

      <div className="flex flex-col lg:ml-64">
        <Header />
        <main className="flex-1 p-4 pt-20 lg:pb-4 pb-28">
          {children}
        </main>
      </div>
      <Toaster richColors />
    </div>
  );
}