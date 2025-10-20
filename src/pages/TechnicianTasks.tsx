"use client";

import React from "react";
import Layout from "@/components/Layout";
import { useTasks } from "@/context/TaskContext";
import { useTechnicians } from "@/hooks/use-technicians";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskCard from "@/components/TaskCard";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";

const TechnicianTasks: React.FC = () => {
  const { tasks } = useTasks();
  const { technicians, loading: loadingTechnicians, error: techniciansError } = useTechnicians();

  if (loadingTechnicians) {
    return (
      <Layout>
        <div className="text-center py-8">Loading technicians...</div>
      </Layout>
    );
  }

  if (techniciansError) {
    return (
      <Layout>
        <div className="text-center py-8 text-destructive">Error loading technicians: {techniciansError}</div>
      </Layout>
    );
  }

  const tasksByTechnician: { [key: string]: typeof tasks } = {};
  const unassignedTasks = tasks.filter(task => !task.assigneeId);

  technicians.forEach(tech => {
    tasksByTechnician[tech.id] = tasks.filter(task => task.assigneeId === tech.id);
  });

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-8 text-center">Tasks by Technician</h2>

      {/* Unassigned Tasks Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Unassigned Tasks ({unassignedTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {unassignedTasks.length === 0 ? (
            <p className="text-muted-foreground text-center">No unassigned tasks.</p>
          ) : (
            unassignedTasks.map(task => <TaskCard key={task.id} task={task} />)
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Assigned Tasks Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {technicians.length === 0 ? (
          <p className="text-muted-foreground text-center col-span-full">No technicians found.</p>
        ) : (
          technicians.map(tech => (
            <Card key={tech.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> {tech.first_name} {tech.last_name} ({tasksByTechnician[tech.id]?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {tasksByTechnician[tech.id]?.length === 0 ? (
                  <p className="text-muted-foreground text-center text-sm">No tasks assigned to this technician.</p>
                ) : (
                  tasksByTechnician[tech.id].map(task => <TaskCard key={task.id} task={task} />)
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
};

export default TechnicianTasks;