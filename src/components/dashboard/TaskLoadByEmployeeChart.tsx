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

  const employeeTaskData: Record<string, { name: string; completed: number; inProgress: number; pending: number }> = {};

  // Initialize data for all technicians
  technicians.forEach(tech => {
    employeeTaskData[tech.id] = {
      name: `${tech.first_name} ${tech.last_name}`,
      completed: 0,
      inProgress: 0,
      pending: 0,
    };
  });

  // Add unassigned tasks to a special category
  employeeTaskData['unassigned'] = {
    name: t('unassigned'),
    completed: 0,
    inProgress: 0,
    pending: 0,
  };

  tasks.forEach(task => {
    const assigneeId = task.assignee_id || 'unassigned';
    if (!employeeTaskData[assigneeId]) {
      // This might happen if a task is assigned to a user not in the technicians list (e.g., admin/manager)
      // For simplicity, we'll add them as 'Other' or their name if available
      const assignedUser = technicians.find(tech => tech.id === assigneeId);
      employeeTaskData[assigneeId] = {
        name: assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : t('other'),
        completed: 0,
        inProgress: 0,
        pending: 0,
      };
    }

    if (task.status === 'completed') {
      employeeTaskData[assigneeId].completed++;
    } else if (task.status === 'in-progress') {
      employeeTaskData[assigneeId].inProgress++;
    } else if (task.status === 'assigned' || task.status === 'unassigned') { // Consider 'assigned' and 'unassigned' as pending for this chart
      employeeTaskData[assigneeId].pending++;
    }
  });

  const chartData = Object.values(employeeTaskData);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('task_load_by_employee')}</CardTitle>
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
            <Bar dataKey="pending" stackId="a" fill="#FFBB28" name={t('pending')} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TaskLoadByEmployeeChart;