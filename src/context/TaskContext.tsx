"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import { Task } from "@/types/task";
import { v4 as uuidv4 } from "uuid";

interface TaskContextType {
  tasks: Task[];
  addTask: (title: string, description?: string, location?: string, workOrderNumber?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['typeOfWork']) => void;
  changeTaskStatus: (id: string, newStatus: Task['status']) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, newTitle: string, newDescription?: string, newLocation?: string, newWorkOrderNumber?: string, newDueDate?: string, newAssigneeId?: string | null, newTypeOfWork?: Task['typeOfWork']) => void;
  assignTask: (id: string, assigneeId: string | null) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const addTask = (title: string, description?: string, location?: string, workOrderNumber?: string, dueDate?: string, assigneeId?: string | null, typeOfWork?: Task['typeOfWork']) => {
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
      typeOfWork,
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

  const updateTask = (id: string, newTitle: string, newDescription?: string, newLocation?: string, newWorkOrderNumber?: string, newDueDate?: string, newAssigneeId?: string | null, newTypeOfWork?: Task['typeOfWork']) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, title: newTitle, description: newDescription, location: newLocation, workOrderNumber: newWorkOrderNumber, dueDate: newDueDate, assigneeId: newAssigneeId, typeOfWork: newTypeOfWork } : task
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