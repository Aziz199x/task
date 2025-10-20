"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Task } from '@/types/task';
import { useTranslation } from 'react-i18next';

interface TaskStatusOverviewChartProps {
  tasks: Task[];
}

const COLORS = {
  'assigned': '#FFBB28',
  'cancelled': '#8884d8',
  'completed': '#00C49F',
  'in-progress': '#0088FE',
  'unassigned': '#FF8042',
};

const TaskStatusOverviewChart: React.FC<TaskStatusOverviewChartProps> = ({ tasks }) => {
  const { t } = useTranslation();

  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<Task['status'], number>);

  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: t(status.replace('-', '_')),
    value: count,
    status: status as Task['status'],
  }));

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('task_status_overview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.status]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} (${((value as number / tasks.length) * 100).toFixed(1)}%)`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TaskStatusOverviewChart;