"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { useSession } from "@/context/SessionContext";
import { useEffect } from "react";
import { toast } from "sonner"; // Import toast

const TASKS_QUERY_KEY = ['tasks'];

const fetchAllTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error("Failed to load tasks: " + error.message);
  }
  return data as Task[];
};

export const useTasksQuery = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const query = useQuery<Task[], Error>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchAllTasks,
    enabled: !!user,
    staleTime: 1000 * 10, // Keep stale time at 10 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 5, // Set polling frequency to 5 seconds
  });

  // Display error toast if query fails
  useEffect(() => {
    if (query.error) {
      toast.error(`Failed to load tasks: ${query.error.message}`);
    }
  }, [query.error]);

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