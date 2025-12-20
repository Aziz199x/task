"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from "react";
import { Task } from "@/types/task";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./SessionContext";
import { useTranslation } from 'react-i18next';
import { useTasksQuery } from "@/hooks/use-tasks-query";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react"; // Import Loader2 for loading state
import { toastSuccess, toastError, toastInfo, toastWarning, toastLoading, dismissToast } from '@/utils/toast'; // Import new toast helpers

interface TaskContextType {
  tasks: Task[];
  tasksByIdMap: Map<string, Task>;
  loading: boolean;
  addTask: (title: string, description?: string, location?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['type_of_work'], equipmentNumber?: string, notificationNum?: string, priority?: Task['priority']) => Promise<boolean>;
  addTasksBulk: (newTasks: Partial<Task>[]) => Promise<void>;
  changeTaskStatus: (id: string, newStatus: Task['status']) => Promise<boolean>;
  deleteTask: (id: string) => Promise<Task | null>; // Modified to return deleted task
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  assignTask: (id: string, assigneeId: string | null) => Promise<boolean>;
  deleteTaskPhoto: (photoUrl: string) => Promise<void>;
  restoreTask: (task: Task) => Promise<boolean>; // New function for undo
  refetchTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const TASKS_QUERY_KEY = ['tasks'];

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Access session context first
  const sessionContext = useSession();
  const { user, profile, loading: sessionLoading } = sessionContext;
  
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Only enable the task query if the session is loaded (not initial loading)
  const { data: tasks = [], isLoading: tasksQueryLoading, refetch: refetchTasksQuery } = useTasksQuery();

  const tasksByIdMap = useMemo(() => {
    if (!Array.isArray(tasks)) return new Map<string, Task>();
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
            if (newRecord.creator_id !== user.id) toastInfo(t('new_task_created_notification', { title: newRecord.title }));
            if (newRecord.assignee_id === user.id && newRecord.creator_id !== user.id) {
              playNotificationSound();
              toastWarning(t('new_task_assigned_warning', { title: newRecord.title }));
            }
          } else if (payload.eventType === 'UPDATE' && oldRecord) {
            if (newRecord.creator_id !== user.id) {
              if (oldRecord.status !== newRecord.status) toastInfo(t('task_status_changed_notification', { title: newRecord.title, status: t(newRecord.status.replace('-', '_')) }));
              if (oldRecord.assignee_id !== newRecord.assignee_id) {
                if (newRecord.assignee_id === user.id) {
                  playNotificationSound();
                  toastWarning(t('task_assigned_to_you_warning', { title: newRecord.title }));
                } else if (oldRecord.assignee_id === user.id) {
                  toastInfo(t('task_unassigned_from_you_notification', { title: newRecord.title }));
                }
              }
              if ((oldRecord.photo_before_urls?.length || 0) < (newRecord.photo_before_urls?.length || 0)) toastInfo(t('photo_added_notification', { title: newRecord.title, type: t('before') }));
              if ((oldRecord.photo_after_urls?.length || 0) < (newRecord.photo_after_urls?.length || 0)) toastInfo(t('photo_added_notification', { title: newRecord.title, type: t('after') }));
              if (!oldRecord.photo_permit_url && newRecord.photo_permit_url) toastInfo(t('photo_added_notification', { title: newRecord.title, type: t('permit') }));
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
        console.log(`[TaskContext] Attempting to generate unique task ID (attempt ${attempts + 1}/${MAX_ATTEMPTS})`);
        
        // Add a timeout to the query
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timed out')), 10000)
        );
        
        const queryPromise = supabase.from('tasks').select('task_id').eq('task_id', newTaskId).limit(1);
        
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error("[TaskContext] Error checking for unique task ID:", error.message);
          throw error;
        }
        if (!data || data.length === 0) {
          unique = true;
          console.log(`[TaskContext] Generated unique task ID: ${newTaskId}`);
        } else {
          console.log(`[TaskContext] Task ID ${newTaskId} already exists, retrying...`);
        }
      } catch (e: any) {
        console.error("[TaskContext] Exception during unique task ID generation:", e.message);
        toastError(e);
        throw e;
      }
      attempts++;
    }

    if (!unique) {
      throw new Error(t('failed_to_generate_unique_task_id_after_attempts'));
    }
    return newTaskId;
  }, [t]);

  const addTask = useCallback(async (title: string, description?: string, location?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['type_of_work'], equipmentNumber?: string, notificationNum?: string, priority?: Task['priority']): Promise<boolean> => {
    console.log('[TaskContext] addTask called with:', { title, equipmentNumber, assigneeId });
    
    if (!equipmentNumber) {
      toastError(t("equipment_number_mandatory"));
      return false;
    }

    if (notificationNum && notificationNum.trim() !== "") {
      try {
        console.log('[TaskContext] Checking notification number uniqueness...');
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timed out')), 10000)
        );
        
        const queryPromise = supabase
          .from('tasks')
          .select('id')
          .eq('notification_num', notificationNum.trim())
          .limit(1);

        const { data, error: checkError } = await Promise.race([queryPromise, timeoutPromise]) as any;

        if (checkError) {
          console.error('[TaskContext] Error checking notification number:', checkError.message);
          toastError(checkError);
          return false;
        }
        if (data && data.length > 0) {
          toastError(t("notification_num_not_unique"));
          return false;
        }
      } catch (e: any) {
        console.error("[TaskContext] Exception during notification number uniqueness check:", e.message);
        toastError(e);
        return false;
      }
    }

    let taskId: string | undefined;
    try {
      console.log('[TaskContext] Generating unique task ID...');
      taskId = await generateUniqueTaskId();
      console.log('[TaskContext] Task ID generated:', taskId);
    } catch (error: any) {
      console.error('[TaskContext] Failed to generate task ID:', error.message);
      toastError(error);
      return false;
    }

    // Use 'unassigned' as the default status for new tasks
    const initialStatus: Task['status'] = assigneeId ? 'assigned' : 'unassigned';
    
    // Set assigned_by_id if an assignee is selected
    const assignedById = assigneeId ? user?.id || null : null;

    const taskPayload: Omit<Task, 'id'> = {
      created_at: new Date().toISOString(),
      title,
      description: description || null,
      location: location || null,
      task_id: taskId,
      due_date: dueDate || null,
      assignee_id: assigneeId || null,
      assigned_by_id: assignedById, // Set assigned_by_id
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

    // --- Optimistic Update Start ---
    const tempId = 'temp-' + Date.now();
    const optimisticTask = { ...taskPayload, id: tempId, _optimistic: true } as Task & { _optimistic?: boolean };

    await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
    const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
    if (previousTasks) {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, [optimisticTask, ...previousTasks]);
    }
    // --- Optimistic Update End ---

    console.log('[TaskContext] Inserting task into database...');
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database insert timed out')), 15000)
      );
      
      const insertPromise = supabase
        .from('tasks')
        .insert(taskPayload)
        .select()
        .single();

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

      if (error) {
        console.error('[TaskContext] Error inserting task:', error.message);
        toastError(error);
        // Revert optimistic update on failure
        if (previousTasks) {
          queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
        }
        return false;
      }
      
      console.log('[TaskContext] Task inserted successfully:', data);
      // Invalidate to replace optimistic task with real data
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      
      // Show success toast
      toastSuccess(t('task_added_successfully'));

      return true;
    } catch (e: any) {
      console.error('[TaskContext] Exception during task insert:', e.message);
      toastError(e);
      // Revert optimistic update on exception
      if (previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
      }
      return false;
    }
  }, [user, generateUniqueTaskId, t, queryClient]);

  const addTasksBulk = useCallback(async (newTasks: Partial<Task>[]) => {
    const notificationNums = newTasks
      .map(t => t.notification_num)
      .filter((n): n is string => !!n && n.trim() !== "");

    if (notificationNums.length > 0) {
      const uniqueNums = new Set(notificationNums);
      if (uniqueNums.size !== notificationNums.length) {
        toastError(t("upload_contains_duplicates"));
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('notification_num')
          .in('notification_num', notificationNums);

        if (error) {
          toastError(t("error_checking_notification_numbers", { message: error.message }));
          return;
        }
        if (data && data.length > 0) {
          const existingNums = data.map(d => d.notification_num).join(', ');
          toastError(t("upload_numbers_exist", { existingNums }));
          return;
        }
      } catch (e: any) {
        console.error("Exception during bulk notification number uniqueness check:", e.message);
        toastError(e);
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
        toastError(error);
        return;
      }
      
      const initialStatus: Task['status'] = task.assignee_id ? 'assigned' : 'unassigned';
      const assignedById = task.assignee_id ? user?.id || null : null; // Set assigned_by_id if an assignee is selected

      const fullTaskPayload: Omit<Task, 'id'> = {
        created_at: new Date().toISOString(),
        title: task.title || '',
        description: task.description || null,
        location: task.location || null,
        task_id: taskId,
        due_date: task.due_date || null,
        assignee_id: task.assignee_id || null,
        assigned_by_id: assignedById, // Set assigned_by_id
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
      optimisticTasks.push({ ...fullTaskPayload, id: 'temp-' + Date.now() + Math.random(), _optimistic: true } as Task);
    }
    if (tasksToInsert.length === 0) {
      toastWarning(t('no_valid_tasks_found_in_excel'));
      return;
    }

    await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
    const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
    if (previousTasks) {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, [...optimisticTasks, ...previousTasks]);
    }
    
    const { error: insertError } = await supabase.from('tasks').insert(tasksToInsert);

    if (insertError) {
      toastError(insertError);
      if (previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
      }
    } else {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toastSuccess(t('tasks_added_successfully_bulk', { count: tasksToInsert.length })); // Added success toast
    }
  }, [user, generateUniqueTaskId, t, queryClient]);

  const changeTaskStatus = useCallback(async (id: string, newStatus: Task['status']): Promise<boolean> => {
    const taskToUpdate = tasksByIdMap.get(id);
    if (!taskToUpdate) {
      toastError(t("task_not_found"));
      return false;
    }
    
    // Enforce the flow: unassigned/assigned -> in-progress -> completed
    if (newStatus === 'in-progress' && taskToUpdate.status !== 'unassigned' && taskToUpdate.status !== 'assigned') {
        toastError(t("task_must_be_pending_to_start_progress"));
        return false;
    }
    if (newStatus === 'completed' && taskToUpdate.status !== 'in-progress') {
        toastError(t("task_must_be_in_progress_to_complete"));
        return false;
    }
    if (taskToUpdate.status === 'completed' && newStatus !== 'in-progress' && profile?.role !== 'admin') {
      toastError(t("completed_tasks_admin_only"));
      return false;
    }
    
    if (newStatus === 'completed') {
      const canCurrentUserComplete = (profile?.id === taskToUpdate.assignee_id) || (profile?.role === 'admin');
      if (!canCurrentUserComplete) {
        toastError(t("permission_denied_complete_task"));
        return false;
      }
      if (!taskToUpdate.notification_num || (taskToUpdate.photo_before_urls?.length || 0) === 0 || (taskToUpdate.photo_after_urls?.length || 0) === 0 || !taskToUpdate.photo_permit_url) {
        toastError(t("photos_and_permit_required_to_complete"));
        return false;
      }
    }
    if (newStatus === 'cancelled') {
      const canCancel = (profile?.id === taskToUpdate.creator_id) || (profile && ['admin', 'manager'].includes(profile.role));
      if (!canCancel) {
        toastError(t("permission_denied_cancel_task"));
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

    if (newStatus === 'unassigned') {
      updates.assignee_id = null;
      updates.assigned_by_id = null; // Clear assigned_by_id when unassigned
    }

    await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
    const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
    if (previousTasks) {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, previousTasks.map(task => task.id === id ? { ...task, ...updates } : task));
    }
    
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) {
      toastError(error);
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
      // Extract the file path from the URL
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split('/task_photos/');
      if (pathParts.length < 2) return;
      
      const filePath = pathParts[1];
      const { error } = await supabase.storage.from('task_photos').remove([filePath]);
      if (error) toastError(t('failed_to_delete_photo_from_storage', { message: error.message }));
    } catch (error: any) {
      toastError(t('failed_to_delete_photo_from_storage', { message: error.message }));
    }
  }, [t]);

  const deleteTask = useCallback(async (id: string): Promise<Task | null> => {
    const taskToDelete = tasksByIdMap.get(id);
    if (!taskToDelete) {
      toastError(t("task_not_found"));
      return null;
    }

    const isCreator = user?.id === taskToDelete.creator_id;
    const isAdminOrManager = profile && ['admin', 'manager'].includes(profile.role);
    const isTechnician = profile?.role === 'technician';

    if (isAdminOrManager) {
      if (taskToDelete.status === 'completed' && profile?.role !== 'admin') {
        toastError(t("completed_tasks_admin_only_delete"));
        return null;
      }
    } else if (isTechnician && isCreator) {
      if (taskToDelete.status === 'completed' || taskToDelete.status === 'cancelled') {
        toastError(t("technician_cannot_delete_completed_or_cancelled_task"));
        return null;
      }
    } else {
      toastError(t("permission_denied_delete_task"));
      return null;
    }

    await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
    const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
    if (previousTasks) {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, previousTasks.filter(task => task.id !== id));
    }

    // Delete all photos associated with the task
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
      toastError(error);
      if (previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
      }
      return null;
    }
    queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    return taskToDelete; // Return the deleted task for undo
  }, [tasksByIdMap, profile, user, t, deleteTaskPhoto, queryClient]);

  const restoreTask = useCallback(async (task: Task): Promise<boolean> => {
    // Remove the 'id' field as Supabase will generate a new one on insert
    // Or, if we want to restore with the same ID, we need to ensure it's not a conflict
    // For simplicity and to avoid potential ID conflicts, let's re-insert as a new task
    // If the original ID is truly unique and we want to restore it, we'd need to handle that carefully.
    // For now, let's assume a new ID is fine for "undo" as it's more about restoring the data.
    const { id, ...taskToInsert } = task;

    // Optimistic update: add the task back to the cache
    await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
    const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
    if (previousTasks) {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, [task, ...previousTasks]);
    }

    const { error } = await supabase.from('tasks').insert(taskToInsert);

    if (error) {
      toastError(error);
      // Revert optimistic update if insert fails
      if (previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
      }
      return false;
    }
    queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    toastSuccess(t('task_restored_successfully', { title: task.title }));
    return true;
  }, [t, queryClient]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<boolean> => {
    const taskToUpdate = tasksByIdMap.get(id);
    if (!taskToUpdate) {
      toastError(t("task_not_found"));
      return false;
    }

    const finalUpdates = { ...updates };

    if (taskToUpdate.status === 'completed') {
      if (profile?.role !== 'admin') {
        toastError(t("completed_tasks_admin_only_modify"));
        return false;
      }
      if (finalUpdates.status && finalUpdates.status !== 'completed') {
        delete finalUpdates.status;
        toastInfo(t("completed_task_status_preserved"));
      }
    }

    // If assignee_id is being updated, also update assigned_by_id
    if (finalUpdates.assignee_id !== undefined && finalUpdates.assignee_id !== taskToUpdate.assignee_id) {
      finalUpdates.assigned_by_id = finalUpdates.assignee_id ? user?.id || null : null;
      
      // If assigning, set status to 'assigned' if it was 'unassigned'.
      if (finalUpdates.assignee_id && taskToUpdate.status === 'unassigned') {
        finalUpdates.status = 'assigned';
      } else if (!finalUpdates.assignee_id && taskToUpdate.status === 'assigned') {
        // If unassigning, set status to 'unassigned'
        finalUpdates.status = 'unassigned';
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
          toastError(checkError);
          return false;
        }
        if (existingTask && existingTask.length > 0) {
          toastError(t("notification_num_not_unique"));
          return false;
        }
      } catch (e: any) {
        console.error("Exception during notification number uniqueness check (updateTask):", e.message);
        toastError(e);
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
      toastError(error);
      if (previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
      }
      return false;
    }
    queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    return true;
  }, [tasksByIdMap, profile, user, t, queryClient]);

  const assignTask = useCallback(async (id: string, assigneeId: string | null): Promise<boolean> => {
    const taskToUpdate = tasksByIdMap.get(id);
    if (!taskToUpdate) {
      toastError(t("task_not_found"));
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
        toastError(t("completed_tasks_admin_only_assign"));
        return false;
      }
      // Admin can reassign completed tasks, but status remains 'completed'
      delete updates.status;
    }

    // Set assigned_by_id if assignment is changing
    if (taskToUpdate.assignee_id !== assigneeId) {
      updates.assigned_by_id = assigneeId ? user?.id || null : null;
    }

    if (taskToUpdate.assignee_id === assigneeId && taskToUpdate.status === updates.status) {
      toastInfo(t("no_change_in_assignment"));
      return false;
    }

    await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
    const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
    if (previousTasks) {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, previousTasks.map(task => task.id === id ? { ...task, ...updates } : task));
    }

    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) {
      toastError(error);
      if (previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, previousTasks);
      }
      return false;
    }
    queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    return true;
  }, [tasksByIdMap, profile, user, t, queryClient]);

  const refetchTasks = useCallback(async () => {
    await refetchTasksQuery();
  }, [refetchTasksQuery]);

  const contextValue = useMemo(() => ({
    tasks,
    tasksByIdMap,
    loading: tasksQueryLoading,
    addTask,
    addTasksBulk,
    changeTaskStatus,
    deleteTask,
    updateTask,
    assignTask,
    deleteTaskPhoto,
    restoreTask, // Add restoreTask to context
    refetchTasks,
  }), [tasks, tasksByIdMap, tasksQueryLoading, addTask, addTasksBulk, changeTaskStatus, deleteTask, updateTask, assignTask, deleteTaskPhoto, restoreTask, refetchTasks]);

  // If the session is still loading, we should not proceed with task logic or render children.
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">{t('loading')}...</span>
      </div>
    );
  }

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