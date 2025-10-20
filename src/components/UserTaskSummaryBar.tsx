"use client";

import React, { useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { useTasks } from '@/context/TaskContext';
import { useTranslation } from 'react-i18next';
import { ListChecks, CircleDotDashed } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserTaskSummaryBar: React.FC = () => {
  const { user } = useSession();
  const { tasks } = useTasks();
  const { t } = useTranslation();

  const userTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter(task => task.assignee_id === user.id);
  }, [tasks, user]);

  const tasksToAccomplish = useMemo(() => {
    return userTasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled').length;
  }, [userTasks]);

  if (!user || userTasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-secondary text-secondary-foreground py-2 px-4 shadow-inner">
      <div className="container mx-auto flex items-center justify-center flex-wrap gap-4 md:gap-6 text-sm">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <span>{t('you_have')} <strong>{userTasks.length}</strong> {t('tasks_assigned')}</span>
        </div>
        <div className="flex items-center gap-2">
          <CircleDotDashed className="h-5 w-5 text-amber-600" />
          <span><strong>{tasksToAccomplish}</strong> {t('tasks_to_accomplish')}</span>
        </div>
        <Link to="/" className="text-primary hover:underline font-medium">
          {t('view_my_tasks')}
        </Link>
      </div>
    </div>
  );
};

export default UserTaskSummaryBar;