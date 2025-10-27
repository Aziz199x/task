"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Task } from '@/types/task';
import { useTranslation } from 'react-i18next';

interface ActiveTaskOverviewChartProps {
  tasks: Task[];
}

const COLORS = {
  'assigned': '#FFBB28', // Yellow/Orange
  'pending': '#FF8042', // Orange
};

const ActiveTaskOverviewChart: React.FC<ActiveTaskOverviewChartProps> = ({ tasks }) => {
  const { t } = useTranslation();

  // Filter tasks to only include 'assigned' and 'unassigned' (which we'll call 'pending')
  const activeTasks = tasks.filter(task => 
    task.status === 'assigned' || 
    task.status === 'unassigned'
  );

  const statusCounts = activeTasks.reduce((acc, task) => {
    if (task.status === 'assigned') {
      acc.assigned = (acc.assigned || 0) + 1;
    } else if (task.status === 'unassigned') {
      acc.pending = (acc.pending || 0) + 1;
    }
    return acc;
  }, {} as Record<'assigned' | 'pending', number>);

  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: t(status),
    value: count,
    status: status as 'assigned' | 'pending',
  }));

  // Only render if there's data to show
  if (data.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('active_task_overview')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          {t('no_assigned_or_pending_tasks')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('active_task_overview')}</CardTitle>
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
            <Tooltip formatter={(value, name) => [`${value} (${((value as number / activeTasks.length) * 100).toFixed(1)}%)`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ActiveTaskOverviewChart;