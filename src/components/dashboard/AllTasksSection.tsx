"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/pages/TaskList'; // Re-using the existing TaskList
import TaskStatusColumn from '@/components/TaskStatusColumn'; // Re-using the existing TaskStatusColumn
import { useTasks } from '@/context/TaskContext';
import { Task } from '@/types/task';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/context/SessionContext';

const AllTasksSection: React.FC = () => {
  const { tasks } = useTasks();
  const { t } = useTranslation();
  const { profile: currentUserProfile } = useSession();
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);

  const canAddTask = currentUserProfile && currentUserProfile.role === 'admin';

  const pendingTasks = useMemo(() => tasks.filter(task => task.status === 'unassigned' || task.status === 'assigned'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter(task => task.status === 'in-progress'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(task => task.status === 'completed'), [tasks]);

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('all_tasks')}</CardTitle>
        {canAddTask && (
          <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> {t('new_task')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('add_new_task')}</DialogTitle>
              </DialogHeader>
              <TaskForm />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="board" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="board">{t('board_view')}</TabsTrigger>
            <TabsTrigger value="list">{t('list_view')}</TabsTrigger>
          </TabsList>
          <TabsContent value="board" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <TaskStatusColumn title={t('pending')} tasks={pendingTasks} />
              <TaskStatusColumn title={t('in_progress')} tasks={inProgressTasks} />
              <TaskStatusColumn title={t('completed')} tasks={completedTasks} />
            </div>
          </TabsContent>
          <TabsContent value="list" className="mt-4">
            <TaskList hideForm={true} /> {/* Pass hideForm prop */}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AllTasksSection;