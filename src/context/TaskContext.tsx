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
  addTask: (title: string, description?: string, location?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['typeOfWork'], equipmentNumber?: string, notificationNum?: string) => Promise<void>;
  addTasksBulk: (newTasks: Partial<Task>[]) => Promise<void>; // New bulk add function
  changeTaskStatus: (id: string, newStatus: Task['status']) => Promise<boolean>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  assignTask: (id: string, assigneeId: string | null) => Promise<void>;
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

  const addTask = async (title: string, description?: string, location?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['typeOfWork'], equipmentNumber?: string, notificationNum?: string) => {
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
      notification_num: notificationNum || null, // Include notification_num
      status: assigneeId ? 'assigned' : 'unassigned',
    });

    if (error) {
      toast.error(t("failed_to_add_task") + error.message);
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
        notification_num: task.notification_num || null, // Include notification_num
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

    // Validation: Require task_id and notification_num for completion
    if (newStatus === 'completed') {
      if (!taskToUpdate.task_id) {
        toast.error(t("task_id_required_to_complete"));
        return false;
      }
      if (!taskToUpdate.notification_num) {
        toast.error(t("notification_num_required_to_complete")); // New validation
        return false;
      }
    }

    const isTechOrContractor = profile && ['technician', 'contractor'].includes(profile.role);

    // Updated condition to include photo_permit_url
    if (isTechOrContractor && newStatus === 'completed' && (!taskToUpdate.photo_before_url || !taskToUpdate.photo_after_url || !taskToUpdate.photo_permit_url)) {
        toast.error(t("photos_and_permit_required_to_complete"));
        return false;
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      toast.error(t("failed_to_update_status") + error.message);
      return false;
    }
    return true;
  };

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete && taskToDelete.status === 'completed' && profile?.role !== 'admin') {
      toast.error(t("completed_tasks_admin_only_delete"));
      return;
    }
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast.error(t("failed_to_delete_task") + error.message);
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
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, loading, addTask, addTasksBulk, changeTaskStatus, deleteTask, updateTask, assignTask }}>
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