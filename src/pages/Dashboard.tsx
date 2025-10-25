"use client";

import React, { useMemo } from "react";
import { useTasks } from "@/context/TaskContext";
import Layout from "@/components/Layout";
import { useTranslation } from 'react-i18next';
import { Briefcase, Clock, Zap, CheckCircle } from 'lucide-react';
import SummaryCard from "@/components/dashboard/SummaryCard";
import TaskStatusOverviewChart from "@/components/dashboard/TaskStatusOverviewChart";
import TaskLoadByEmployeeChart from "@/components/dashboard/TaskLoadByEmployeeChart";
import AllTasksSection from "@/components/dashboard/AllTasksSection";
import UserManagementCard from "@/components/dashboard/UserManagementCard";
import TasksByUserList from "@/components/dashboard/TasksByUserList"; // Import the new component
import { useTechnicians } from "@/hooks/use-technicians";

const Dashboard: React.FC = () => {
  const { tasks } = useTasks();
  const { technicians } = useTechnicians();
  const { t } = useTranslation();

  const totalTasks = tasks.length;
  const pendingTasksCount = tasks.filter(task => task.status === 'unassigned' || task.status === 'assigned').length;
  const inProgressTasksCount = tasks.filter(task => task.status === 'in-progress').length;
  const completedTasksCount = tasks.filter(task => task.status === 'completed').length;

  const completionRate = useMemo(() => {
    if (totalTasks === 0) return "0%";
    return `${((completedTasksCount / totalTasks) * 100).toFixed(0)}%`;
  }, [completedTasksCount, totalTasks]);

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-6">{t('dashboard')}</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Total Tasks"
          value={totalTasks}
          icon={Briefcase}
          iconBgColor="bg-blue-100"
          iconTextColor="text-blue-600"
        />
        <SummaryCard
          title="Pending"
          value={pendingTasksCount}
          icon={Clock}
          iconBgColor="bg-yellow-100"
          iconTextColor="text-yellow-600"
        />
        <SummaryCard
          title="In Progress"
          value={inProgressTasksCount}
          icon={Zap}
          iconBgColor="bg-purple-100"
          iconTextColor="text-purple-600"
        />
        <SummaryCard
          title="Completion Rate"
          value={completionRate}
          icon={CheckCircle}
          iconBgColor="bg-green-100"
          iconTextColor="text-green-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <TaskStatusOverviewChart tasks={tasks} />
        <TaskLoadByEmployeeChart tasks={tasks} technicians={technicians} />
        <UserManagementCard />
      </div>

      {/* Tasks by User List */}
      <TasksByUserList />

      {/* All Tasks Section */}
      <AllTasksSection />
    </Layout>
  );
};

export default Dashboard;