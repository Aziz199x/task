"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasks } from '@/context/TaskContext';
import { useProfiles } from '@/hooks/use-profiles';
import { User as UserIcon, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TaskCard from '@/components/TaskCard'; // Re-use TaskCard for displaying individual tasks

const TasksByUserList: React.FC = () => {
  const { tasks, loading: tasksLoading } = useTasks();
  const { profiles, loading: profilesLoading, error: profilesError } = useProfiles();
  const { t } = useTranslation();

  const activeTasks = useMemo(() => {
    return tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
  }, [tasks]);

  const tasksGroupedByAssignee = useMemo(() => {
    const grouped: { [key: string]: typeof activeTasks } = {
      unassigned: activeTasks.filter(task => !task.assignee_id),
    };

    profiles.forEach(profile => {
      grouped[profile.id] = activeTasks.filter(task => task.assignee_id === profile.id);
    });

    return grouped;
  }, [activeTasks, profiles]);

  if (tasksLoading || profilesLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>{t('tasks_by_user')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (profilesError) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>{t('tasks_by_user')}</CardTitle>
        </CardHeader>
        <CardContent className="text-destructive">{t('error_loading_user_profiles')}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{t('tasks_by_user')}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Unassigned Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" /> {t('unassigned_tasks')} ({tasksGroupedByAssignee.unassigned.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 max-h-[400px] overflow-y-auto">
            {tasksGroupedByAssignee.unassigned.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm">{t('no_unassigned_tasks')}</p>
            ) : (
              tasksGroupedByAssignee.unassigned.map(task => <TaskCard key={task.id} taskId={task.id} />) // Pass taskId
            )}
          </CardContent>
        </Card>

        {/* Tasks for each assigned user */}
        {profiles.map(profile => {
          const userTasks = tasksGroupedByAssignee[profile.id] || [];
          if (userTasks.length === 0) return null; // Only show cards for users with active tasks

          return (
            <Card key={profile.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" /> {profile.first_name} {profile.last_name} ({userTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 max-h-[400px] overflow-y-auto">
                {userTasks.map(task => <TaskCard key={task.id} taskId={task.id} />)} {/* Pass taskId */}
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TasksByUserList;