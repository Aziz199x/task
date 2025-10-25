"use client";

import React from "react";
import { Task } from "@/types/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskCard from "@/components/TaskCard";
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface TaskStatusColumnProps {
  title: string;
  tasks: Task[];
}

const TaskStatusColumn: React.FC<TaskStatusColumnProps> = ({ title, tasks }) => {
  const { t } = useTranslation(); // Initialize useTranslation

  return (
    <Card className="w-full min-w-[280px] max-w-sm flex-shrink-0">
      <CardHeader>
        <CardTitle className="text-lg">{title} ({tasks.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">{t('no_tasks_in_this_category')}</p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} taskId={task.id} />) // Pass taskId
        )}
      </CardContent>
    </Card>
  );
};

export default TaskStatusColumn;