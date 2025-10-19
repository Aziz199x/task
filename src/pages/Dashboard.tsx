"use client";

import React from "react";
import { useTasks } from "@/context/TaskContext";
import Layout from "@/components/Layout";
import TaskStatusColumn from "@/components/TaskStatusColumn"; // Import the new component

const Dashboard: React.FC = () => {
  const { tasks } = useTasks();

  const unassignedTasks = tasks.filter(task => task.status === 'unassigned');
  const assignedTasks = tasks.filter(task => task.status === 'assigned');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const cancelledTasks = tasks.filter(task => task.status === 'cancelled');

  return (
    <Layout>
      <div className="flex flex-wrap gap-4 justify-center">
        <TaskStatusColumn title="Unassigned" tasks={unassignedTasks} />
        <TaskStatusColumn title="Assigned" tasks={assignedTasks} />
        <TaskStatusColumn title="In Progress" tasks={inProgressTasks} />
        <TaskStatusColumn title="Completed" tasks={completedTasks} />
        <TaskStatusColumn title="Cancelled" tasks={cancelledTasks} />
      </div>
    </Layout>
  );
};

export default Dashboard;