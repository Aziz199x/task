"use client";

import React from "react";
import Layout from "@/components/Layout";
import { useTasks } from "@/context/TaskContext";
import { useTechnicians } from "@/hooks/use-technicians";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskCard from "@/components/TaskCard";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";
import { useTranslation } from 'react-i18next'; // Import useTranslation

const TechnicianTasks: React.FC = () => {
  const { tasks } = useTasks();
  const { technicians, loading: loadingTechnicians, error: techniciansError } = useTechnicians();
  const { t } = useTranslation(); // Initialize useTranslation

  if (loadingTechnicians) {
    return (
      <Layout>
        <div className="text-center py-8">{t('loading_technicians')}</div>
      </Layout>
    );
  }

  if (techniciansError) {
    return (
      <Layout>
        <div className="text-center py-8 text-destructive">{t('error_loading_technicians')} {techniciansError}</div>
      </Layout>
    );
  }

  const tasksByTechnician: { [key: string]: typeof tasks } = {};
  const unassignedTasks = tasks.filter(task => !task.assignee_id);

  technicians.forEach(tech => {
    tasksByTechnician[tech.id] = tasks.filter(task => task.assignee_id === tech.id);
  });

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-8 text-center">{t('tasks_by_technician')}</h2>

      {/* Unassigned Tasks Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> {t('unassigned_tasks')} ({unassignedTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {unassignedTasks.length === 0 ? (
            <p className="text-muted-foreground text-center">{t('no_unassigned_tasks')}</p>
          ) : (
            unassignedTasks.map(task => <TaskCard key={task.id} task={task} />)
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Assigned Tasks Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {technicians.length === 0 ? (
          <p className="text-muted-foreground text-center col-span-full">{t('no_technicians_found')}</p>
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
                  <p className="text-muted-foreground text-center text-sm">{t('no_tasks_assigned_to_this_technician')}</p>
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