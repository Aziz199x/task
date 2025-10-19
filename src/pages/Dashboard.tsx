"use client";

import React from "react";
import { useTasks } from "@/context/TaskContext";
import TaskCard from "@/components/TaskCard";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Dashboard: React.FC = () => {
  const { tasks } = useTasks();

  const unassignedTasks = tasks.filter(task => !task.assigneeId);

  return (
    <Layout>
      <div className="space-y-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Unassigned Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {unassignedTasks.length === 0 ? (
              <p className="text-center text-muted-foreground">All tasks are assigned!</p>
            ) : (
              <div className="grid gap-4">
                {unassignedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;