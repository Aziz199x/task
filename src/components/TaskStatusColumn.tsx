"use client";

import React from "react";
import { Task } from "@/types/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskCard from "@/components/TaskCard";

interface TaskStatusColumnProps {
  title: string;
  tasks: Task[];
}

const TaskStatusColumn: React.FC<TaskStatusColumnProps> = ({ title, tasks }) => {
  return (
    <Card className="w-full min-w-[280px] max-w-sm flex-shrink-0">
      <CardHeader>
        <CardTitle className="text-lg">{title} ({tasks.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">No tasks in this category.</p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </CardContent>
    </Card>
  );
};

export default TaskStatusColumn;