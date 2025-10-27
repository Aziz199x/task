"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Task } from '@/types/task';
import { TechnicianProfile } from '@/hooks/use-technicians';
import { useTranslation } from 'react-i18next';

interface TaskLoadByEmployeeChartProps {
  tasks: Task[];
  technicians: TechnicianProfile[];
}

const TaskLoadByEmployeeChart: React.FC<TaskLoadByEmployeeChartProps> = ({ tasks, technicians }) => {
  const { t } = useTranslation();

  const employeeTaskData: Record<string, { name: string; completed: number; inProgress: number; cancelled: number }> = {};

  // Initialize data for all technicians
  technicians.forEach(tech => {
    employeeTaskData[tech.id] = {
      name: `${tech.first_name} ${tech.last_name}`,
      completed: 0,
      inProgress: 0,
      cancelled: 0,
    };
  });

  // Add unassigned tasks to a special category (if they are in relevant statuses)
  // For this chart, we are focusing on assigned/completed/in-progress/cancelled states
  // Unassigned tasks are generally 'pending' and are excluded from this specific chart's scope as per request.

  tasks.forEach(task => {
    const assigneeId = task.assignee_id || 'unassigned'; // Keep 'unassigned' for tasks without an assignee
    
    // Only include tasks that have an assignee for this chart, or if 'unassigned' tasks are explicitly requested for these statuses.
    // As per the request, we only want 'completed', 'in-progress', 'cancelled'.
    // Unassigned tasks are typically 'pending' or 'assigned' status, which are not in the requested list.
    // So, we will only count tasks that are explicitly assigned and in the requested statuses.
    if (!task.assignee_id) return; // Skip unassigned tasks for this chart as per new requirements

    if (!employeeTaskData[assigneeId]) {
      const assignedUser = technicians.find(tech => tech.id === assigneeId);
      employeeTaskData[assigneeId] = {
        name: assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : t('other'),
        completed: 0,
        inProgress: 0,
        cancelled: 0,
      };
    }

    if (task.status === 'completed') {
      employeeTaskData[assigneeId].completed++;
    } else if (task.status === 'in-progress') {
      employeeTaskData[assigneeId].inProgress++;
    } else if (task.status === 'cancelled') {
      employeeTaskData[assigneeId].cancelled++;
    }
  });

  // Filter out employees with no relevant tasks to display
  const chartData = Object.values(employeeTaskData).filter(
    data => data.completed > 0 || data.inProgress > 0 || data.cancelled > 0
  );

  // If no data, display a message
  if (chartData.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('tasks_by_employee')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          {t('no_completed_in_progress_or_cancelled_tasks')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('tasks_by_employee')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" stackId="a" fill="#00C49F" name={t('completed')} />
            <Bar dataKey="inProgress" stackId="a" fill="#0088FE" name={t('in_progress')} />
            <Bar dataKey="cancelled" stackId="a" fill="#FFBB28" name={t('cancelled')} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TaskLoadByEmployeeChart;