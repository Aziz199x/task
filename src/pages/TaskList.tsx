"use client";

import React from "react";
import { useTasks } from "@/context/TaskContext";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";

const TaskList: React.FC = () => {
  const { tasks } = useTasks();

  return (
    <div className="space-y-8">
      <TaskForm />
      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <p className="text-center text-muted-foreground">No tasks yet. Add one above!</p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
};

export default TaskList;