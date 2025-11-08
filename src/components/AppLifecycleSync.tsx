"use client";

import { useCallback, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/context/SessionContext";
import { useTasks } from "@/context/TaskContext";
import { toast } from "sonner";

const AppLifecycleSync = () => {
  const { refetchProfile } = useSession();
  const { refetchTasks } = useTasks();

  const syncData = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("[AppLifecycleSync] Failed to retrieve session:", error.message);
      toast.error("Failed to refresh session. Please try again.");
      return;
    }

    const userId = data.session?.user?.id;
    const operations: Promise<unknown>[] = [refetchTasks()];

    if (userId) {
      operations.push(refetchProfile(userId));
    }

    const results = await Promise.allSettled(operations);
    const hasFailure = results.some((result) => result.status === "rejected");

    if (hasFailure) {
      toast.error("Unable to sync the latest data. Pull to refresh or try again shortly.");
    }
  }, [refetchProfile, refetchTasks]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: PluginListenerHandle | undefined;

    const register = async () => {
      listenerHandle = await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          void syncData();
        }
      });
    };

    void register();

    return () => {
      listenerHandle?.remove();
    };
  }, [syncData]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [syncData]);

  return null;
};

export default AppLifecycleSync;