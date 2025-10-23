"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { Task } from "@/types/task";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "./SessionContext";
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (title: string, description?: string, location?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['typeOfWork'], equipmentNumber?: string, notificationNum?: string, priority?: Task['priority']) => Promise<void>;
  addTasksBulk: (newTasks: Partial<Task>[]) => Promise<void>; // New bulk add function
  changeTaskStatus: (id: string, newStatus: Task['status']) => Promise<boolean>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  assignTask: (id: string, assigneeId: string | null) => Promise<void>;
  deleteTaskPhoto: (photoUrl: string) => Promise<void>; // New function to delete a photo
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useSession();
  const { t } = useTranslation(); // Initialize useTranslation

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
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
    }
  }, [user, fetchTasks]);

  useEffect(() => {
    const channel = supabase
      .channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        fetchTasks(); // Refetch all tasks on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const generateUniqueTaskId = async (): Promise<string> => {
    let unique = false;
    let newTaskId = '';
    while (!unique) {
      // Generate a random 15-digit number
      // Ensure it starts with a non-zero digit to be exactly 15 digits
      newTaskId = String(Math.floor(100000000000000 + Math.random() * 900000000000000));

      const { data, error } = await supabase
        .from('tasks')
        .select('task_id')
        .eq('task_id', newTaskId)
        .limit(1);

      if (error) {
        console.error("Error checking task ID uniqueness during generation:", error.message);
        throw new Error(t('error_generating_unique_task_id'));
      }

      if (!data || data.length === 0) {
        unique = true;
      }
    }
    return newTaskId;
  };

  const addTask = async (title: string, description?: string, location?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['typeOfWork'], equipmentNumber?: string, notificationNum?: string, priority?: Task['priority']) => {
    if (!equipmentNumber) {
      toast.error(t("equipment_number_mandatory"));
      return;
    }

    let taskId: string | undefined;
    try {
      taskId = await generateUniqueTaskId();
    } catch (error: any) {
      toast.error(error.message);
      return;
    }

    const { error } = await supabase.from('tasks').insert({
      title,
      description,
      location,
      task_id: taskId,
      due_date: dueDate || null,
      assignee_id: assigneeId,
      type_of_work: typeOfWork,
      equipment_number: equipmentNumber,
      notification_num: notificationNum || null,
      priority: priority || 'medium', // Set default priority if not provided
      status: assigneeId ? 'assigned' : 'unassigned',
      creator_id: user?.id, // Ensure creator_id is set
    });

    if (error) {
      toast.error(t("failed_to_add_task") + error.message);
    } else {
      fetchTasks(); // Refresh tasks after successful single insert
    }
  };

  const addTasksBulk = async (newTasks: Partial<Task>[]) => {
    const tasksToInsert = [];
    for (const task of newTasks) {
      if (!task.equipment_number) {
        // Skip tasks missing mandatory equipment number
        console.warn("Skipping task in bulk import due to missing equipment number:", task);
        continue;
      }
      let taskId: string | undefined;
      try {
        taskId = await generateUniqueTaskId();
      } catch (error: any) {
        toast.error(error.message);
        return; // Stop bulk import if generation fails
      }

      tasksToInsert.push({
        ...task,
        task_id: taskId,
        notification_num: task.notification_num || null,
        priority: task.priority || 'medium', // Set default priority if not provided
        status: task.assignee_id ? 'assigned' : 'unassigned',
        creator_id: user?.id, // Assign current user as creator
      });
    }

    if (tasksToInsert.length === 0) {
      toast.warning(t('no_valid_tasks_found_in_excel'));
      return;
    }

    const { error } = await supabase.from('tasks').insert(tasksToInsert);

    if (error) {
      toast.error(t("failed_to_add_tasks_bulk") + error.message);
    } else {
      fetchTasks(); // Refresh tasks after bulk insert
    }
  };

  const changeTaskStatus = async (id: string, newStatus: Task['status']) => {
    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate) {
        toast.error(t("task_not_found"));
        return false;
    }

    if (taskToUpdate.status === 'completed' && profile?.role !== 'admin') {
      toast.error(t("completed_tasks_admin_only"));
      return false;
    }

    // New permission check for completing a task
    if (newStatus === 'completed') {
      const canCurrentUserComplete = 
        (profile?.id === taskToUpdate.assignee_id) || // Is the assignee
        (profile?.role === 'supervisor' && profile?.id === taskToUpdate.creator_id) || // Is the supervisor who created it
        (profile?.role === 'admin'); // Is an admin (admin override)

      if (!canCurrentUserComplete) {
        toast.error(t("permission_denied_complete_task"));
        return false;
      }

      // Existing validation: Require task_id and notification_num for completion by ALL users
      if (!taskToUpdate.task_id) {
        toast.error(t("task_id_required_to_complete"));
        return false;
      }
      if (!taskToUpdate.notification_num) {
        toast.error(t("notification_num_required_to_complete"));
        return false;
      }
      // Require photo_before_url, photo_after_url, and photo_permit_url for completion by ALL users
      if (!taskToUpdate.photo_before_url || !taskToUpdate.photo_after_url || !taskToUpdate.photo_permit_url) {
          toast.error(t("photos_and_permit_required_to_complete"));
          return false;
      }
    }

    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === 'completed' && user?.id) {
      updates.closed_by_id = user.id; // Set who closed the task
    } else if (newStatus !== 'completed') {
      updates.closed_by_id = null; // Clear if status changes from completed
    }

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error(t("failed_to_update_status") + error.message);
      return false;
    } else {
      fetchTasks(); // Force a refresh after successful status update
    }
    return true;
  };

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete && taskToDelete.status === 'completed' && profile?.role !== 'admin') {
      toast.error(t("completed_tasks_admin_only_delete"));
      return;
    }
    // Also delete associated photos from storage
    if (taskToDelete?.photo_before_url) await deleteTaskPhoto(taskToDelete.photo_before_url);
    if (taskToDelete?.photo_after_url) await deleteTaskPhoto(taskToDelete.photo_after_url);
    if (taskToDelete?.photo_permit_url) await deleteTaskPhoto(taskToDelete.photo_permit_url);

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast.error(t("failed_to_delete_task") + error.message);
    } else {
      fetchTasks(); // Force a refresh after successful delete
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const taskToUpdate = tasks.find(t => t.id === id);
    if (taskToUpdate && taskToUpdate.status === 'completed' && profile?.role !== 'admin') {
      toast.error(t("completed_tasks_admin_only"));
      return;
    }
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error(t("failed_to_update_task") + error.message);
    } else {
      fetchTasks(); // Force a refresh after successful update
    }
  };

  const assignTask = async (id: string, assigneeId: string | null) => {
    const taskToUpdate = tasks.find(t => t.id === id);
    if (taskToUpdate && taskToUpdate.status === 'completed' && profile?.role !== 'admin') {
      toast.error(t("completed_tasks_admin_only"));
      return;
    }
    const newStatus = assigneeId ? 'assigned' : 'unassigned';
    const { error } = await supabase
      .from('tasks')
      .update({ assignee_id: assigneeId, status: newStatus })
      .eq('id', id);
    if (error) {
      toast.error(t("failed_to_assign_task") + error.message);
    } else {
      fetchTasks(); // Force a refresh after successful assignment
    }
  };

  const deleteTaskPhoto = async (photoUrl: string) => {
    try {
      // Extract the path from the public URL
      const urlParts = photoUrl.split('/public/task_photos/');
      if (urlParts.length < 2) {
        console.warn("Invalid photo URL for deletion:", photoUrl);
        return;
      }
      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('task_photos')
        .remove([filePath]);

      if (error) {
        console.error("Error deleting photo from storage:", error.message);
        toast.error(`${t('failed_to_delete_photo_from_storage')}: ${error.message}`);
      } else {
        console.log("Photo deleted from storage:", filePath);
      }
    } catch (error: any) {
      console.error("Unexpected error during photo deletion:", error.message);
      toast.error(`${t('failed_to_delete_photo_from_storage')}: ${error.message}`);
    }
  };

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