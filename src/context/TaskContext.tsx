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
  addTask: (title: string, description?: string, location?: string, workOrderNumber?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['typeOfWork'], equipmentNumber?: string) => Promise<void>;
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

  const addTask = async (title: string, description?: string, location?: string, workOrderNumber?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['typeOfWork'], equipmentNumber?: string) => {
    if (!equipmentNumber) {
      toast.error(t("equipment_number_mandatory"));
      return;
    }
    const { error } = await supabase.from('tasks').insert({
      title,
      description,
      location,
      work_order_number: workOrderNumber,
      due_date: dueDate || null,
      assignee_id: assigneeId,
      type_of_work: typeOfWork,
      equipment_number: equipmentNumber,
      status: assigneeId ? 'assigned' : 'unassigned',
    });

    if (error) {
      toast.error(t("failed_to_add_task") + error.message);
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
    <TaskContext.Provider value={{ tasks, loading, addTask, changeTaskStatus, deleteTask, updateTask, assignTask }}>
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