"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { useSession } from "@/context/SessionContext";
import { useEffect } from "react";

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
    staleTime: 1000 * 60 * 1, // 1 minute stale time
    refetchOnWindowFocus: true, // Refetch when app comes back into focus
  });

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
          console.log('Real-time task change received, invalidating cache:', payload.eventType, payload.new?.id || payload.old?.id);
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