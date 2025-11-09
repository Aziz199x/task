"use client";

import { useEffect } from "react";
import { useSidebar } from "@/state/useSidebar";
import useIsDesktop from "@/hooks/use-is-desktop.tsx";
import { SidebarContent } from "./SidebarContent";
import { Header } from "./Header";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "@/context/SessionContext";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSidebar();
  const { user } = useSession();
  const { t } = useTranslation();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r bg-sidebar lg:flex" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent 
          side="left" 
          // p-0 removes default padding. pt-[env(safe-area-inset-top)] pushes content below status bar.
          // [&>button]:hidden hides the default SheetClose button to prevent overlap with custom header button.
          className="w-64 p-0 pt-[env(safe-area-inset-top)] [&>button]:hidden"
        >
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="flex flex-col lg:pl-64">
        <Header />
        {/* Adjusted pt-16 to pt-20 to accommodate the new, potentially taller header */}
        <main className="flex flex-1 flex-col gap-4 p-4 pt-20 lg:gap-6 lg:p-6 lg:pt-24">
          {children}
        </main>
      </div>
    </div>
  );
}