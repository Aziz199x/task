"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { Task } from "@/types/task";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "./SessionContext";

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (title: string, description?: string, location?: string, workOrderNumber?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['type_of_work'], equipmentNumber?: string) => Promise<void>;
  changeTaskStatus: (id: string, newStatus: Task['status']) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  assignTask: (id: string, assigneeId: string | null) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSession();

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

  const addTask = async (title: string, description?: string, location?: string, workOrderNumber?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['type_of_work'], equipmentNumber?: string) => {
    if (!equipmentNumber) {
      toast.error("Equipment number is mandatory.");
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
      toast.error("Failed to add task: " + error.message);
    }
  };

  const changeTaskStatus = async (id: string, newStatus: Task['status']) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete task: " + error.message);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error("Failed to update task: " + error.message);
    }
  };

  const assignTask = async (id: string, assigneeId: string | null) => {
    const newStatus = assigneeId ? 'assigned' : 'unassigned';
    const { error } = await supabase
      .from('tasks')
      .update({ assignee_id: assigneeId, status: newStatus })
      .eq('id', id);
    if (error) {
      toast.error("Failed to assign task: " + error.message);
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