"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Task } from '@/types/task';
import { useTranslation } from 'react-i18next';

interface CombinedTaskStatusChartProps {
  tasks: Task[];
}

const COLORS: { [key: string]: string } = {
  'completed': '#00C49F', // Green
  'in-progress': '#0088FE', // Blue
  'pending': '#FFBB28', // Orange (for unassigned/assigned)
  'cancelled': '#8884d8', // Purple
};

const CombinedTaskStatusChart: React.FC<CombinedTaskStatusChartProps> = ({ tasks }) => {
  const { t } = useTranslation();

  const statusCounts = tasks.reduce((acc, task) => {
    let statusKey: 'completed' | 'in-progress' | 'pending' | 'cancelled';
    if (task.status === 'unassigned' || task.status === 'assigned') {
      statusKey = 'pending';
    } else {
      statusKey = task.status;
    }
    acc[statusKey] = (acc[statusKey] || 0) + 1;
    return acc;
  }, {} as Record<'completed' | 'in-progress' | 'pending' | 'cancelled', number>);

  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: t(status.replace('-', '_')),
    value: count,
    status: status,
  }));

  // Only render if there's data to show
  if (data.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('overall_task_status_overview')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          {t('no_tasks_to_display')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('overall_task_status_overview')}</CardTitle>
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

export default CombinedTaskStatusChart;