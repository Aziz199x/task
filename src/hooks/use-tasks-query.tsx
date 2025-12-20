"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { useSession } from "@/context/SessionContext";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { toastError } from '@/utils/toast'; // Import new toast helpers

const TASKS_QUERY_KEY = ['tasks'];
const FETCH_TIMEOUT_MS = 10000; // 10 seconds timeout

// Custom fetcher with timeout
const fetchAllTasks = async (): Promise<Task[]> => {
  const fetchPromise = supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Database query timed out')), FETCH_TIMEOUT_MS)
  );

  try {
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

    if (error) {
      throw error;
    }
    return data as Task[];
  } catch (e: any) {
    if (e.message.includes('timed out')) {
      throw new Error('Database connection timed out.');
    }
    throw e;
  }
};

export const useTasksQuery = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const query = useQuery<Task[], Error>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchAllTasks,
    enabled: !!user,
    staleTime: 1000 * 10, // Keep stale time at 10 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 5, // Set polling frequency to 5 seconds
    retry: 3, // Increased retry attempts
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff up to 30s
  });

  const { isError, error } = query;

  useEffect(() => {
    if (isError) {
      // Show a user-friendly toast message on final failure
      toastError(error);
      console.error("Task query final failure:", error?.message);
    }
  }, [isError, error]);

  // Real-time subscription setup
  useEffect(() => {
    if (!user) {
      // Clear tasks cache if user logs out
      queryClient.setQueryData(TASKS_QUERY_KEY, []);
      return;
    }

    const channel = supabase
      .channel('public:tasks_query')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          const newRecord = payload.new as Partial<Task>;
          const oldRecord = payload.old as Partial<Task>;
          console.log('Real-time task change received, invalidating cache:', payload.eventType, newRecord?.id || oldRecord?.id);
          // Invalidate the query cache to trigger a background refetch
          queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
};

// Skeleton component for task list loading state
export const TaskListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-start p-4 border rounded-lg shadow-sm">
          <Skeleton className="h-5 w-5 mr-4 mt-1.5" />
          <div className="flex-grow space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};