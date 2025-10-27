"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from "react";
import { Task } from "@/types/task";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "./SessionContext";
import { useTranslation } from 'react-i18next';
import { useTasksQuery } from "@/hooks/use-tasks-query";
import { useQueryClient } from "@tanstack/react-query";

interface TaskContextType {
  tasks: Task[];
  tasksByIdMap: Map<string, Task>;
  loading: boolean;
  addTask: (title: string, description?: string, location?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['typeOfWork'], equipmentNumber?: string, notificationNum?: string, priority?: Task['priority']) => Promise<boolean>;
  addTasksBulk: (newTasks: Partial<Task>[]) => Promise<void>;
  changeTaskStatus: (id: string, newStatus: Task['status']) => Promise<boolean>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  assignTask: (id: string, assigneeId: string | null) => Promise<boolean>;
  deleteTaskPhoto: (photoUrl: string) => Promise<void>;
  refetchTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const TASKS_QUERY_KEY = ['tasks'];

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile } = useSession();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const { data: tasks = [], isLoading: loading, refetch: refetchTasks } = useTasksQuery();

  const tasksByIdMap = useMemo(() => {
    return new Map(tasks.map(task => [task.id, task]));
  }, [tasks]);

  const playNotificationSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:tasks_notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          const newRecord = payload.new as Task;
          const oldRecord = payload.old as Task;

          if (payload.eventType === 'INSERT') {
            if (newRecord.creator_id !== user.id) toast.info(t('new_task_created_notification', { title: newRecord.title }));
            if (newRecord.assignee_id === user.id && newRecord.creator_id !== user.id) {
              playNotificationSound();
              toast.warning(t('new_task_assigned_warning', { title: newRecord.title }), { duration: 8000, style: { background: '#FEF3C7', border: '2px solid #F59E0B', color: '#92400E', fontWeight: 'bold' }, icon: '⚠️' });
            }
          } else if (payload.eventType === 'UPDATE' && oldRecord) {
            if (newRecord.creator_id !== user.id) {
              if (oldRecord.status !== newRecord.status) toast.info(t('task_status_changed_notification', { title: newRecord.title, status: t(newRecord.status.replace('-', '_')) }));
              if (oldRecord.assignee_id !== newRecord.assignee_id) {
                if (newRecord.assignee_id === user.id) {
                  playNotificationSound();
                  toast.warning(t('task_assigned_to_you_warning', { title: newRecord.title }), { duration: 8000, style: { background: '#FEF3C7', border: '2px solid #F59E0B', color: '#92400E', fontWeight: 'bold' }, icon: '⚠️' });
                } else if (oldRecord.assignee_id === user.id) {
                  toast.info(t('task_unassigned_from_you_notification', { title: newRecord.title }));
                }
              }
              if ((oldRecord.photo_before_urls?.length || 0) < (newRecord.photo_before_urls?.length || 0)) toast.info(t('photo_added_notification', { title: newRecord.title, type: t('before') }));
              if ((oldRecord.photo_after_urls?.length || 0) < (newRecord.photo_after_urls?.length || 0)) toast.info(t('photo_added_notification', { title: newRecord.title, type: t('after') }));
              if (!oldRecord.photo_permit_url && newRecord.photo_permit_url) toast.info(t('photo_added_notification', { title: newRecord.title, type: t('permit') }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, t, playNotificationSound]);

  const generateUniqueTaskId = useCallback(async (): Promise<string> => {
    let unique = false;
    let newTaskId = '';
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (!unique && attempts < MAX_ATTEMPTS) {
      newTaskId = String(Math.floor(100000000000000 + Math.random() * 900000000000000));
      try {
        const { data, error } = await supabase.from('tasks').select('task_id').eq('task_id', newTaskId).limit(1);
        if (error) {
          console.error("Error checking for unique task ID:", error.message);
          throw new Error(t('error_generating_unique_task_id') + ": " + error.message);
        }
        if (!data || data.length === 0) {
          unique = true;
        }
      } catch (e: any) {
        console.error("Exception during unique task ID generation:", e.message);
        throw e;
      }
      attempts++;
    }

    if (!unique) {
      throw new Error(t('failed_to_generate_unique_task_id_after_attempts'));
    }
    return newTaskId;
  }, [t]);

  const addTask = useCallback(async (title: string, description?: string, location?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['typeOfWork'], equipmentNumber?: string, notificationNum?: string, priority?: Task['priority']): Promise<boolean> => {
    if (!equipmentNumber) {
      toast.error(t("equipment_number_mandatory"));
      return false;
    }

    if (notificationNum && notificationNum.trim() !== "") {
      try {
        const { data, error: checkError } = await supabase
          .from('tasks')
          .select('id')
          .eq('notification_num', notificationNum.trim())
          .limit(1);

        if (checkError) {
          toast.error(`Error checking notification number: ${checkError.message}`);
          return false;
        }
        if (data && data.length > 0) {
          toast.error(t("notification_num_not_unique"));
          return false;
        }
      } catch (e: any) {
        console.error("Exception during notification number uniqueness check:", e.message);
        toast.error(`Error checking notification number: ${e.message}`);
        return false;
      }
    }

    let taskId: string | undefined;
    try {
      taskId = await generateUniqueTaskId();
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }

    // Use 'unassigned' as the default status for new tasks
    const initialStatus: Task['status'] = assigneeId ? 'assigned' : 'unassigned';

    const taskPayload: Omit<Task, 'id'> = {
      created_at: new Date().toISOString(),
      title,
      description: description || null,
      location: location || null,
      task_id: taskId,
      due_date: dueDate || null,
      assignee_id: assigneeId || null,
      type_of_work: typeOfWork || null,
      equipment_number: equipmentNumber,
      notification_num: notificationNum || null,
      priority: priority || 'medium',
      status: initialStatus, // Set initial status based on assignment
      creator_id: user?.id || null,
      photo_before_urls: [],
      photo_after_urls: [],
      photo_permit_url: null,
    };

    const tempId = 'temp-' + Date.now();
    const optimisticTask = { ...taskPayload, id: tempId } as Task;

    await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
    const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
    if (previousTasks) {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, [optimisticTask, ...previousTasks]);
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskPayload)
      .select()
      .single();

    if (error) {
      toast.error(t("failed_to_add_task") + error.message);
      if (previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
      }
      return false;
    }
    
    queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    return true;
  }, [user, generateUniqueTaskId, t, queryClient]);

  const addTasksBulk = useCallback(async (newTasks: Partial<Task>[]) => {
    const notificationNums = newTasks
      .map(t => t.notification_num)
      .filter((n): n is string => !!n && n.trim() !== "");

    if (notificationNums.length > 0) {
      const uniqueNums = new Set(notificationNums);
      if (uniqueNums.size !== notificationNums.length) {
        toast.error(t("upload_contains_duplicates"));
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('notification_num')
          .in('notification_num', notificationNums);

        if (error) {
          toast.error(t("error_checking_notification_numbers", { message: error.message }));
          return;
        }
        if (data && data.length > 0) {
          const existingNums = data.map(d => d.notification_num).join(', ');
          toast.error(t("upload_numbers_exist", { existingNums }));
          return;
        }
      } catch (e: any) {
        console.error("Exception during bulk notification number uniqueness check:", e.message);
        toast.error(`Error checking notification numbers: ${e.message}`);
        return;
      }
    }

    const tasksToInsert: Omit<Task, 'id'>[] = [];
    const optimisticTasks: Task[] = [];

    for (const task of newTasks) {
      if (!task.equipment_number) continue;
      let taskId: string | undefined;
      try {
        taskId = await generateUniqueTaskId();
      } catch (error: any) {
        toast.error(error.message);
        return;
      }
      
      const initialStatus: Task['status'] = task.assignee_id ? 'assigned' : 'unassigned';

      const fullTaskPayload: Omit<Task, 'id'> = {
        created_at: new Date().toISOString(),
        title: task.title || '',
        description: task.description || null,
        location: task.location || null,
        task_id: taskId,
        due_date: task.due_date || null,
        assignee_id: task.assignee_id || null,
        type_of_work: task.type_of_work || null,
        equipment_number: task.equipment_number,
        notification_num: task.notification_num || null,
        priority: task.priority || 'medium',
        status: initialStatus, // Set initial status based on assignment
        creator_id: user?.id || null,
        photo_before_urls: [],
        photo_after_urls: [],
        photo_permit_url: null,
      };
      tasksToInsert.push(fullTaskPayload);
      optimisticTasks.push({ ...fullTaskPayload, id: 'temp-' + Date.now() + Math.random() } as Task);
    }
    if (tasksToInsert.length === 0) {
      toast.warning(t('no_valid_tasks_found_in_excel'));
      return;
    }

    await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
    const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
    if (previousTasks) {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, [...optimisticTasks, ...previousTasks]);
    }
    
    const { error: insertError } = await supabase.from('tasks').insert(tasksToInsert);

    if (insertError) {
      toast.error(t("failed_to_add_tasks_bulk") + insertError.message);
      if (previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
      }
    } else {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    }
  }, [user, generateUniqueTaskId, t, queryClient]);

  const changeTaskStatus = useCallback(async (id: string, newStatus: Task['status']): Promise<boolean> => {
    const taskToUpdate = tasksByIdMap.get(id);
    if (!taskToUpdate) {
      toast.error(t("task_not_found"));
      return false;
    }
    
    // Enforce the flow: unassigned/assigned -> in-progress -> completed
    if (newStatus === 'in-progress' && taskToUpdate.status !== 'unassigned' && taskToUpdate.status !== 'assigned') {
        toast.error(t("task_must_be_pending_to_start_progress"));
        return false;
    }
    if (newStatus === 'completed' && taskToUpdate.status !== 'in-progress') {
        toast.error(t("task_must_be_in_progress_to_complete"));
        return false;
    }
    if (taskToUpdate.status === 'completed' && newStatus !== 'in-progress' && profile?.role !== 'admin') {
      toast.error(t("completed_tasks_admin_only"));
      return false;
    }
    
    if (newStatus === 'completed') {
      const canCurrentUserComplete = (profile?.id === taskToUpdate.assignee_id) || (profile?.role === 'admin');
      if (!canCurrentUserComplete) {
        toast.error(t("permission_denied_complete_task"));
        return false;
      }
      if (!taskToUpdate.notification_num || (taskToUpdate.photo_before_urls?.length || 0) === 0 || (taskToUpdate.photo_after_urls?.length || 0) === 0 || !taskToUpdate.photo_permit_url) {
        toast.error(t("photos_and_permit_required_to_complete"));
        return false;
      }
    }
    if (newStatus === 'cancelled') {
      const canCancel = (profile?.id === taskToUpdate.creator_id) || (profile && ['admin', 'manager'].includes(profile.role));
      if (!canCancel) {
        toast.error(t("permission_denied_cancel_task"));
        return false;
      }
    }
    
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === 'completed' && user?.id) {
      updates.closed_by_id = user.id;
      updates.closed_at = new Date().toISOString();
    } else if (newStatus !== 'completed') {
      updates.closed_by_id = null;
      updates.closed_at = null;
    }

    await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
    const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
    if (previousTasks) {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, previousTasks.map(task => task.id === id ? { ...task, ...updates } : task));
    }
    
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) {
      toast.error(t("failed_to_update_status") + error.message);
      if (previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
      }
      return false;
    }
    queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    return true;
  }, [tasksByIdMap, profile, user, t, queryClient]);

  const deleteTaskPhoto = useCallback(async (photoUrl: string) => {
    try {
      const urlParts = photoUrl.split('/task_photos/');
      if (urlParts.length < 2) return;
      const filePath = urlParts[1];
      const { error } = await supabase.storage.from('task_photos').remove([filePath]);
      if (error) toast.error(`${t('failed_to_delete_photo_from_storage')}: ${error.message}`);
    } catch (error: any) {
      toast.error(`${t('failed_to_delete_photo_from_storage')}: ${error.message}`);
    }
  }, [t]);

  const deleteTask = useCallback(async (id: string) => {
    const taskToDelete = tasksByIdMap.get(id);
    if (!taskToDelete) {
      toast.error(t("task_not_found"));
      return;
    }

    const isCreator = user?.id === taskToDelete.creator_id;
    const isAdminOrManager = profile && ['admin', 'manager'].includes(profile.role);
    const isTechnician = profile?.role === 'technician';

    if (isAdminOrManager) {
      if (taskToDelete.status === 'completed' && profile?.role !== 'admin') {
        toast.error(t("completed_tasks_admin_only_delete"));
        return;
      }
    } else if (isTechnician && isCreator) {
      if (taskToDelete.status === 'completed' || taskToDelete.status === 'cancelled') {
        toast.error(t("technician_cannot_delete_completed_or_cancelled_task"));
        return;
      }
    } else {
      toast.error(t("permission_denied_delete_task"));
      return;
    }

    await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
    const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
    if (previousTasks) {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, previousTasks.filter(task => task.id !== id));
    }

    const allPhotos = [
      ...(taskToDelete.photo_before_urls || []),
      ...(taskToDelete.photo_after_urls || []),
      ...(taskToDelete.photo_permit_url ? [taskToDelete.photo_permit_url] : []),
    ];
    
    for (const url of allPhotos) {
      await deleteTaskPhoto(url);
    }
    
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast.error(t("failed_to_delete_task") + error.message);
      if (previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
      }
    }
    queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
  }, [tasksByIdMap, profile, user, t, deleteTaskPhoto, queryClient]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<boolean> => {
    const taskToUpdate = tasksByIdMap.get(id);
    if (!taskToUpdate) {
      toast.error(t("task_not_found"));
      return false;
    }

    const finalUpdates = { ...updates };

    if (taskToUpdate.status === 'completed') {
      if (profile?.role !== 'admin') {
        toast.error(t("completed_tasks_admin_only_modify"));
        return false;
      }
      if (finalUpdates.status && finalUpdates.status !== 'completed') {
        delete finalUpdates.status;
        toast.info(t("completed_task_status_preserved"));
      }
    }

    if (finalUpdates.notification_num && finalUpdates.notification_num.trim() !== "") {
      try {
        const { data: existingTask, error: checkError } = await supabase
          .from('tasks')
          .select('id')
          .eq('notification_num', finalUpdates.notification_num.trim())
          .not('id', 'eq', id)
          .limit(1);

        if (checkError) {
          toast.error(`Error checking notification number: ${checkError.message}`);
          return false;
        }
        if (existingTask && existingTask.length > 0) {
          toast.error(t("notification_num_not_unique"));
          return false;
        }
      } catch (e: any) {
        console.error("Exception during notification number uniqueness check (updateTask):", e.message);
        toast.error(`Error checking notification number: ${e.message}`);
        return false;
      }
    }

    await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
    const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
    if (previousTasks) {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, previousTasks.map(task => task.id === id ? { ...task, ...finalUpdates } : task));
    }

    const { error } = await supabase.from('tasks').update(finalUpdates).eq('id', id);
    if (error) {
      toast.error(t("failed_to_update_task") + error.message);
      if (previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
      }
      return false;
    }
    queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    return true;
  }, [tasksByIdMap, profile, t, queryClient]);

  const assignTask = useCallback(async (id: string, assigneeId: string | null): Promise<boolean> => {
    const taskToUpdate = tasksByIdMap.get(id);
    if (!taskToUpdate) {
      toast.error(t("task_not_found"));
      return false;
    }

    const updates: Partial<Task> = { assignee_id: assigneeId };
    
    // If assigning, set status to 'assigned' if it was 'unassigned'.
    // If unassigning, set status to 'unassigned' if it was 'assigned'.
    if (assigneeId && taskToUpdate.status === 'unassigned') {
        updates.status = 'assigned';
    } else if (!assigneeId && taskToUpdate.status === 'assigned') {
        updates.status = 'unassigned';
    }
    // If status is already in-progress/completed/cancelled, assignment change does not affect status.

    if (taskToUpdate.status === 'completed') {
      if (profile?.role !== 'admin') {
        toast.error(t("completed_tasks_admin_only_assign"));
        return false;
      }
      // Admin can reassign completed tasks, but status remains 'completed'
      delete updates.status;
    }

    if (taskToUpdate.assignee_id === assigneeId && taskToUpdate.status === updates.status) {
      toast.info(t("no_change_in_assignment"));
      return false;
    }

    await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
    const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
    if (previousTasks) {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, previousTasks.map(task => task.id === id ? { ...task, ...updates } : task));
    }

    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) {
      toast.error(t("failed_to_assign_task") + error.message);
      if (previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
      }
      return false;
    }
    queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    return true;
  }, [tasksByIdMap, profile, t, queryClient]);

  const contextValue = useMemo(() => ({
    tasks,
    tasksByIdMap,
    loading,
    addTask,
    addTasksBulk,
    changeTaskStatus,
    deleteTask,
    updateTask,
    assignTask,
    deleteTaskPhoto,
    refetchTasks: refetchTasks as () => Promise<void>,
  }), [tasks, tasksByIdMap, loading, addTask, addTasksBulk, changeTaskStatus, deleteTask, updateTask, assignTask, deleteTaskPhoto, refetchTasks]);

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
};