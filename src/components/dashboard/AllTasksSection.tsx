"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'; // Import Drawer components
import TaskForm from '@/components/TaskForm';
import TaskList from '@/pages/TaskList'; // Re-using the existing TaskList
import TaskStatusColumn from '@/components/TaskStatusColumn'; // Re-using the existing TaskStatusColumn
import { useTasks } from '@/context/TaskContext';
import { Task } from '@/types/task';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/context/SessionContext';
import ExcelUploadButton from '@/components/ExcelUploadButton'; // Import the ExcelUploadButton
import ChatImportButton from '@/components/ChatImportButton'; // Import the new ChatImportButton
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile hook

const AllTasksSection: React.FC = () => {
  const { tasks } = useTasks();
  const { t } = useTranslation();
  const { profile: currentUserProfile } = useSession();
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const { isMobile } = useIsMobile(); // Use the hook to detect mobile

  // Allow 'admin', 'manager', and 'supervisor' roles to add tasks
  const canAddTask = currentUserProfile && ['admin', 'manager', 'supervisor'].includes(currentUserProfile.role);

  // Group 'unassigned' and 'assigned' tasks under 'pending' for the board view
  const pendingTasks = useMemo(() => tasks.filter(task => task.status === 'unassigned' || task.status === 'assigned'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter(task => task.status === 'in-progress'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(task => task.status === 'completed'), [tasks]);

  const TaskFormWrapper = isMobile ? Drawer : Dialog;
  const TaskFormContentWrapper = isMobile ? DrawerContent : DialogContent;
  const TaskFormHeaderWrapper = isMobile ? DrawerHeader : DialogHeader;
  const TaskFormTitleWrapper = isMobile ? DrawerTitle : DialogTitle;
  const TaskFormTriggerWrapper = isMobile ? DrawerTrigger : DialogTrigger;

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <CardTitle>{t('all_tasks')}</CardTitle>
        {/* Updated class names for responsiveness: flex-wrap and gap-2 */}
        <div className="flex flex-wrap items-center gap-2 justify-end max-w-full">
          {canAddTask && (
            <TaskFormWrapper open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
              <TaskFormTriggerWrapper asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" /> {t('new_task')}
                </Button>
              </TaskFormTriggerWrapper>
              <TaskFormContentWrapper className={isMobile ? "h-full" : "sm:max-w-[425px]"}>
                <TaskFormHeaderWrapper className={isMobile ? "text-left" : ""}>
                  <TaskFormTitleWrapper>{t('add_new_task')}</TaskFormTitleWrapper>
                </TaskFormHeaderWrapper>
                <div className={isMobile ? "p-4 overflow-y-auto" : ""}>
                  <TaskForm />
                </div>
              </TaskFormContentWrapper>
            </TaskFormWrapper>
          )}
          {canAddTask && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div> {/* Wrap button in a div for tooltip to work with disabled state */}
                  <ExcelUploadButton />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('import_tasks_from_excel_tooltip')}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {canAddTask && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ChatImportButton />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('import_tasks_from_chat_tooltip')}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
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