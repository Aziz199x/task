"use client";

import React from "react";
import { useTasks } from "@/context/TaskContext";
import Layout from "@/components/Layout";
import TaskStatusColumn from "@/components/TaskStatusColumn";
import { useTranslation } from 'react-i18next'; // Import useTranslation

const Dashboard: React.FC = () => {
  const { tasks } = useTasks();
  const { t } = useTranslation(); // Initialize useTranslation

  const unassignedTasks = tasks.filter(task => task.status === 'unassigned');
  const assignedTasks = tasks.filter(task => task.status === 'assigned');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const cancelledTasks = tasks.filter(task => task.status === 'cancelled');

  return (
    <Layout>
      <div className="flex flex-wrap gap-4 justify-center">
        <TaskStatusColumn title={t('unassigned')} tasks={unassignedTasks} />
        <TaskStatusColumn title={t('assigned')} tasks={assignedTasks} />
        <TaskStatusColumn title={t('in_progress')} tasks={inProgressTasks} />
        <TaskStatusColumn title={t('completed')} tasks={completedTasks} />
        <TaskStatusColumn title={t('cancelled')} tasks={cancelledTasks} />
      </div>
    </Layout>
  );
};

export default Dashboard;