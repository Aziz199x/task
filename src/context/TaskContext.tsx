"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { Task } from "@/types/task";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "./SessionContext";
import { useTranslation } from 'react-i18next';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (title: string, description?: string, location?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['typeOfWork'], equipmentNumber?: string, notificationNum?: string, priority?: Task['priority']) => Promise<boolean>;
  addTasksBulk: (newTasks: Partial<Task>[]) => Promise<void>;
  changeTaskStatus: (id: string, newStatus: Task['status']) => Promise<boolean>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  assignTask: (id: string, assigneeId: string | null) => Promise<void>;
  deleteTaskPhoto: (photoUrl: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useSession();
  const { t } = useTranslation();

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[TaskContext] Error fetching tasks:", error);
      toast.error("Failed to load tasks: " + error.message);
      setTasks([]);
    } else {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();

      const channel = supabase
        .channel('public:tasks')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          (payload) => {
            const newRecord = payload.new as Task;
            const oldRecord = payload.old as { id: string };

            switch (payload.eventType) {
              case 'INSERT':
                setTasks((currentTasks) => {
                  if (currentTasks.some(t => t.id === newRecord.id)) return currentTasks;
                  if (newRecord.creator_id !== user.id) toast.info(t('new_task_created_notification', { title: newRecord.title }));
                  if (newRecord.assignee_id === user.id && newRecord.creator_id !== user.id) {
                    playNotificationSound();
                    toast.warning(t('new_task_assigned_warning', { title: newRecord.title }), { duration: 8000, style: { background: '#FEF3C7', border: '2px solid #F59E0B', color: '#92400E', fontWeight: 'bold' }, icon: '⚠️' });
                  }
                  return [newRecord, ...currentTasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                });
                break;
              case 'UPDATE':
                setTasks((currentTasks) => {
                  const oldTask = currentTasks.find(t => t.id === newRecord.id);
                  if (oldTask && newRecord.creator_id !== user.id) {
                    if (oldTask.status !== newRecord.status) toast.info(t('task_status_changed_notification', { title: newRecord.title, status: t(newRecord.status.replace('-', '_')) }));
                    if (oldTask.assignee_id !== newRecord.assignee_id) {
                      if (newRecord.assignee_id === user.id) {
                        playNotificationSound();
                        toast.warning(t('task_assigned_to_you_warning', { title: newRecord.title }), { duration: 8000, style: { background: '#FEF3C7', border: '2px solid #F59E0B', color: '#92400E', fontWeight: 'bold' }, icon: '⚠️' });
                      } else if (oldTask.assignee_id === user.id) {
                        toast.info(t('task_unassigned_from_you_notification', { title: newRecord.title }));
                      }
                    }
                    if (!oldTask.photo_before_url && newRecord.photo_before_url) toast.info(t('photo_added_notification', { title: newRecord.title, type: t('before') }));
                    if (!oldTask.photo_after_url && newRecord.photo_after_url) toast.info(t('photo_added_notification', { title: newRecord.title, type: t('after') }));
                    if (!oldTask.photo_permit_url && newRecord.photo_permit_url) toast.info(t('photo_added_notification', { title: newRecord.title, type: t('permit') }));
                  }
                  return currentTasks.map((task) => task.id === newRecord.id ? newRecord : task);
                });
                break;
              case 'DELETE':
                setTasks((currentTasks) => {
                  const deletedTask = currentTasks.find(t => t.id === oldRecord.id);
                  if (deletedTask && deletedTask.creator_id !== user.id) toast.info(t('task_deleted_notification', { title: deletedTask.title }));
                  return currentTasks.filter((task) => task.id !== oldRecord.id);
                });
                break;
              default:
                break;
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user, fetchTasks, t, playNotificationSound]);

  const generateUniqueTaskId = useCallback(async (): Promise<string> => {
    let unique = false;
    let newTaskId = '';
    while (!unique) {
      newTaskId = String(Math.floor(100000000000000 + Math.random() * 900000000000000));
      const { data, error } = await supabase.from('tasks').select('task_id').eq('task_id', newTaskId).limit(1);
      if (error) throw new Error(t('error_generating_unique_task_id'));
      if (!data || data.length === 0) unique = true;
    }
    return newTaskId;
  }, [t]);

  const addTask = useCallback(async (title: string, description?: string, location?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['typeOfWork'], equipmentNumber?: string, notificationNum?: string, priority?: Task['priority']): Promise<boolean> => {
    if (!equipmentNumber) {
      toast.error(t("equipment_number_mandatory"));
      return false;
    }

    // Check for notification number uniqueness
    if (notificationNum && notificationNum.trim() !== "") {
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
    }

    let taskId: string | undefined;
    try {
      taskId = await generateUniqueTaskId();
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
    const { error } = await supabase.from('tasks').insert({ title, description, location, task_id: taskId, due_date: dueDate || null, assignee_id: assigneeId, type_of_work: typeOfWork, equipment_number: equipmentNumber, notification_num: notificationNum || null, priority: priority || 'medium', status: assigneeId ? 'assigned' : 'unassigned', creator_id: user?.id });
    if (error) {
      toast.error(t("failed_to_add_task") + error.message);
      return false;
    }
    return true;
  }, [user, generateUniqueTaskId, t]);

  const addTasksBulk = useCallback(async (newTasks: Partial<Task>[]) => {
    const notificationNums = newTasks
      .map(t => t.notification_num)
      .filter((n): n is string => !!n && n.trim() !== "");

    if (notificationNums.length > 0) {
      // Check for duplicates within the uploaded list itself
      const uniqueNums = new Set(notificationNums);
      if (uniqueNums.size !== notificationNums.length) {
        toast.error(t("upload_contains_duplicates"));
        return;
      }

      // Check against the database for existing numbers
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
    }

    const tasksToInsert = [];
    for (const task of newTasks) {
      if (!task.equipment_number) continue;
      let taskId: string | undefined;
      try {
        taskId = await generateUniqueTaskId();
      } catch (error: any) {
        toast.error(error.message);
        return;
      }
      tasksToInsert.push({ ...task, task_id: taskId, notification_num: task.notification_num || null, priority: task.priority || 'medium', status: task.assignee_id ? 'assigned' : 'unassigned', creator_id: user?.id });
    }
    if (tasksToInsert.length === 0) {
      toast.warning(t('no_valid_tasks_found_in_excel'));
      return;
    }
    const { error } = await supabase.from('tasks').insert(tasksToInsert);
    if (error) toast.error(t("failed_to_add_tasks_bulk") + error.message);
  }, [user, generateUniqueTaskId, t]);

  const changeTaskStatus = useCallback(async (id: string, newStatus: Task['status']) => {
    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate) {
      toast.error(t("task_not_found"));
      return false;
    }
    if (taskToUpdate.status === 'completed' && profile?.role !== 'admin') {
      toast.error(t("completed_tasks_admin_only"));
      return false;
    }
    if (newStatus === 'completed') {
      const canCurrentUserComplete = (profile?.id === taskToUpdate.assignee_id) || (profile?.role === 'supervisor' && profile?.id === taskToUpdate.creator_id) || (profile?.role === 'admin');
      if (!canCurrentUserComplete) {
        toast.error(t("permission_denied_complete_task"));
        return false;
      }
      if (!taskToUpdate.notification_num || !taskToUpdate.photo_before_url || !taskToUpdate.photo_after_url || !taskToUpdate.photo_permit_url) {
        toast.error(t("photos_and_permit_required_to_complete"));
        return false;
      }
    }
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === 'completed' && user?.id) updates.closed_by_id = user.id;
    else if (newStatus !== 'completed') updates.closed_by_id = null;
    
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) {
      toast.error(t("failed_to_update_status") + error.message);
      return false;
    }
    if (data) {
      setTasks(currentTasks => currentTasks.map(task => (task.id === id ? data : task)));
    }
    return true;
  }, [tasks, profile, user, t]);

  const deleteTaskPhoto = useCallback(async (photoUrl: string) => {
    try {
      const urlParts = photoUrl.split('/public/task_photos/');
      if (urlParts.length < 2) return;
      const filePath = urlParts[1];
      const { error } = await supabase.storage.from('task_photos').remove([filePath]);
      if (error) toast.error(`${t('failed_to_delete_photo_from_storage')}: ${error.message}`);
    } catch (error: any) {
      toast.error(`${t('failed_to_delete_photo_from_storage')}: ${error.message}`);
    }
  }, [t]);

  const deleteTask = useCallback(async (id: string) => {
    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      toast.error(t("permission_denied_delete_task"));
      return;
    }

    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete && taskToDelete.status === 'completed' && profile?.role !== 'admin') {
      toast.error(t("completed_tasks_admin_only_delete"));
      return;
    }
    if (taskToDelete?.photo_before_url) await deleteTaskPhoto(taskToDelete.photo_before_url);
    if (taskToDelete?.photo_after_url) await deleteTaskPhoto(taskToDelete.photo_after_url);
    if (taskToDelete?.photo_permit_url) await deleteTaskPhoto(taskToDelete.photo_permit_url);
    
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast.error(t("failed_to_delete_task") + error.message);
    } else {
      setTasks(currentTasks => currentTasks.filter(task => task.id !== id));
    }
  }, [tasks, profile, t, deleteTaskPhoto]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<boolean> => {
    // Check for notification number uniqueness if it's being updated
    if (updates.notification_num && updates.notification_num.trim() !== "") {
      const { data: existingTask, error: checkError } = await supabase
        .from('tasks')
        .select('id')
        .eq('notification_num', updates.notification_num.trim())
        .not('id', 'eq', id) // Exclude the current task from the check
        .limit(1);

      if (checkError) {
        toast.error(`Error checking notification number: ${checkError.message}`);
        return false;
      }
      if (existingTask && existingTask.length > 0) {
        toast.error(t("notification_num_not_unique"));
        return false;
      }
    }

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) {
      toast.error(t("failed_to_update_task") + error.message);
      return false;
    } else if (data) {
      setTasks(currentTasks => currentTasks.map(task => (task.id === id ? data : task)));
      return true;
    }
    return false;
  }, [t]);

  const assignTask = useCallback(async (id: string, assigneeId: string | null) => {
    const newStatus = assigneeId ? 'assigned' : 'unassigned';
    const { data, error } = await supabase.from('tasks').update({ assignee_id: assigneeId, status: newStatus }).eq('id', id).select().single();
    if (error) {
      toast.error(t("failed_to_assign_task") + error.message);
    } else if (data) {
      setTasks(currentTasks => currentTasks.map(task => (task.id === id ? data : task)));
    }
  }, [t]);

  return (
    <TaskContext.Provider value={{ tasks, loading, addTask, addTasksBulk, changeTaskStatus, deleteTask, updateTask, assignTask, deleteTaskPhoto }}>
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