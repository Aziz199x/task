"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import { Task } from "@/types/task";
import { v4 as uuidv4 } from "uuid";

interface TaskContextType {
  tasks: Task[];
  addTask: (title: string, description?: string, assigneeId?: string | null, location?: string, workOrderNumber?: string, dueDate?: Date | null) => void;
  changeTaskStatus: (id: string, newStatus: Task['status']) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, newTitle: string, newDescription?: string, newAssigneeId?: string | null, newLocation?: string, newWorkOrderNumber?: string, newDueDate?: Date | null) => void;
  assignTask: (id: string, assigneeId: string | null) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const addTask = (title: string, description?: string, assigneeId?: string | null, location?: string, workOrderNumber?: string, dueDate?: Date | null) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      description,
      status: 'unassigned',
      createdAt: new Date(),
      assigneeId: assigneeId || null,
      location,
      workOrderNumber,
      dueDate,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const changeTaskStatus = (id: string, newStatus: Task['status']) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, status: newStatus } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  const updateTask = (id: string, newTitle: string, newDescription?: string, newAssigneeId?: string | null, newLocation?: string, newWorkOrderNumber?: string, newDueDate?: Date | null) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, title: newTitle, description: newDescription, assigneeId: newAssigneeId, location: newLocation, workOrderNumber: newWorkOrderNumber, dueDate: newDueDate } : task
      )
    );
  };

  const assignTask = (id: string, assigneeId: string | null) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, assigneeId: assigneeId, status: assigneeId ? 'assigned' : 'unassigned' } : task
      )
    );
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, changeTaskStatus, deleteTask, updateTask, assignTask }}>
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