"use client";

import React from "react";
import { Task } from "@/types/task";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, MoreVertical, MapPin, CalendarDays, Hash, User, Wrench, HardHat, BellRing, CheckCircle, Bell, Flag, UserCheck, Clock } from "lucide-react";
import { useTasks } from "@/context/TaskContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useSession } from "@/context/SessionContext";
import { useTechnicians } from "@/hooks/use-technicians";
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from 'react-i18next';
import TaskPhotoGallery from "./TaskPhotoGallery";
import EditTaskForm from "./EditTaskForm"; // Import the new component
import { useProfiles } from "@/hooks/use-profiles"; // Import useProfiles to get all user profiles

interface TaskCardProps {
  task: Task;
  onSelect?: (taskId: string, isSelected: boolean) => void;
  isSelected?: boolean;
}

const googleMapsUrlRegex = /^https:\/\/www\.google\.com\/maps\?q=(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/;

const validateLocationUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === "") {
    return null; // Location is optional
  }
  if (!googleMapsUrlRegex.test(url)) {
    return "location_url_invalid_format"; // Return key for translation
  }
  return null;
};

const TaskCard: React.FC<TaskCardProps> = ({ task: initialTask, onSelect, isSelected }) => {
  const { tasks, changeTaskStatus, deleteTask, assignTask } = useTasks();
  const { user, profile: currentUserProfile } = useSession();
  const { technicians } = useTechnicians();
  const { profiles } = useProfiles(); // Use useProfiles to get all profiles
  const { t } = useTranslation();

  // Get the current task from global state (real-time updates)
  const task = tasks.find(t => t.id === initialTask.id) || initialTask;

  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false); // Keep for status change/assign actions

  const isAdmin = currentUserProfile?.role === 'admin';
  const isCompleted = task.status === 'completed';
  const canEditOrDelete = currentUserProfile && ['admin', 'manager', 'supervisor'].includes(currentUserProfile.role);
  const isTechOrContractor = currentUserProfile && ['technician', 'contractor'].includes(currentUserProfile.role);
  const isAssignedToCurrentUser = user && task.assignee_id === user.id;
  const isCreator = user && task.creator_id === user.id;

  const canComplete = (task.status !== 'completed' && task.status !== 'cancelled') && (
    isAssignedToCurrentUser || 
    (currentUserProfile?.role === 'supervisor' && task.creator_id === user?.id) || 
    isAdmin
  );

  const canEditTask = isAdmin || (!isCompleted && (canEditOrDelete || (isTechOrContractor && isAssignedToCurrentUser)));
  const canDeleteTask = isAdmin || (!isCompleted && canEditOrDelete);
  const canUnassignTask = (isAdmin || isCreator) && task.assignee_id !== null;

  const handleDelete = () => {
    deleteTask(task.id);
    toast.success(t('task_deleted_successfully'));
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    setIsSaving(true); // Indicate saving for status changes
    const success = await changeTaskStatus(task.id, newStatus);
    if (success) {
      toast.success(t('task_status_changed_to', { status: t(newStatus.replace('-', '_')) }));
    }
    setIsSaving(false);
  };

  const handleCompleteClick = async () => {
    const missingFields = [];
    if (!task.photo_before_url) missingFields.push(t('before_work_photo'));
    if (!task.photo_after_url) missingFields.push(t('after_work_photo'));
    if (!task.photo_permit_url) missingFields.push(t('permit_photo'));
    if (!task.notification_num) missingFields.push(t('notification_num'));

    if (missingFields.length > 0) {
      toast.error(`${t('please_fill_in_the_following_fields')}: ${missingFields.join(', ')}`);
      setIsEditing(true); // Open the edit dialog
    } else {
      await handleStatusChange('completed');
    }
  };

  const handleAssignToMe = async () => {
    setIsSaving(true);
    if (user?.id) {
      await assignTask(task.id, user.id);
      toast.success(t('task_assigned_to_you'));
    } else {
      toast.error(t('you_must_be_logged_in_to_assign_tasks'));
    }
    setIsSaving(false);
  };

  const handleUnassign = async () => {
    setIsSaving(true);
    await assignTask(task.id, null);
    toast.success(t('task_unassigned'));
    setIsSaving(false);
  };

  const assignedTechnician = technicians.find(tech => tech.id === task.assignee_id);
  const closedByUser = profiles.find(p => p.id === task.closed_by_id); // Find the user who closed the task

  const dueDateObj = task.due_date ? new Date(task.due_date) : null;
  const now = new Date();
  const isOverdue = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj) && task.status !== 'completed' && task.status !== 'cancelled';
  const isDueSoon = dueDateObj && (isToday(dueDateObj) || isTomorrow(dueDateObj) || (dueDateObj > now && dueDateObj <= addDays(now, 2))) && task.status !== 'completed' && task.status !== 'cancelled';

  const getPriorityColor = (priority: Task['priority'] | undefined) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className={`w-full flex items-start p-4 ${task.status === 'completed' ? "opacity-70" : ""} ${task.status === 'cancelled' ? "border-destructive" : ""} ${isOverdue ? "border-red-500 ring-2 ring-red-500" : ""} ${isDueSoon && !isOverdue ? "border-yellow-500 ring-2 ring-yellow-500" : ""}`}>
      {onSelect && (
        <div className="mr-4 mt-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(task.id, checked === true)}
          />
        </div>
      )}
      <div className="flex-grow">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 p-0">
          <div>
            <CardTitle className={`text-lg font-semibold ${task.status === 'completed' ? "line-through" : ""}`}>
              {task.title}
            </CardTitle>
            {task.task_id && <p className="text-sm font-medium text-muted-foreground pt-1">ID: {task.task_id}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${
              task.status === 'completed' ? 'bg-green-100 text-green-800' :
              task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
              task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
              task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {t(task.status.replace('-', '_'))}
            </span>
            {isOverdue && <BellRing className="h-4 w-4 text-red-500 animate-pulse" />}
            {isDueSoon && !isOverdue && <BellRing className="h-4 w-4 text-yellow-500" />}
            {canEditTask && (
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('edit_task')}</DialogTitle>
                  </DialogHeader>
                  <EditTaskForm
                    task={task}
                    onClose={() => setIsEditing(false)}
                    canEditOrDelete={canEditOrDelete}
                    canComplete={canComplete}
                  />
                </DialogContent>
              </Dialog>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange('unassigned')} disabled={isCompleted && !isAdmin || isSaving}>{t('mark_as_unassigned')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('assigned')} disabled={isCompleted && !isAdmin || isSaving}>{t('mark_as_assigned')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('in-progress')} disabled={isCompleted && !isAdmin || isSaving}>{t('mark_as_in_progress')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('cancelled')} disabled={isCompleted && !isAdmin || isSaving}>{t('mark_as_cancelled')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                {user && !isAssignedToCurrentUser && <DropdownMenuItem onClick={handleAssignToMe} disabled={isCompleted && !isAdmin || isSaving}>{t('assign_to_me')}</DropdownMenuItem>}
                {canUnassignTask && <DropdownMenuItem onClick={handleUnassign} disabled={isCompleted && !isAdmin || isSaving}>{t('unassign')}</DropdownMenuItem>}
                {canDeleteTask && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive" disabled={isSaving}>
                      <Trash2 className="h-4 w-4 mr-2" /> {t('delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-0 pt-2">
          {task.description && <p className={`text-sm text-muted-foreground ${task.status === 'completed' ? "line-through" : ""}`}>{task.description}</p>}
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" /> {t('created_on')}: {format(new Date(task.created_at), 'PPP p')}
          </div>
          {task.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              {validateLocationUrl(task.location) === null ? (
                <a href={task.location} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                  {task.location}
                </a>
              ) : (
                task.location
              )}
            </div>
          )}
          {task.task_id && <div className="flex items-center text-sm text-muted-foreground"><Hash className="h-4 w-4 mr-2" /> {t('task_id')}: {task.task_id}</div>}
          {task.notification_num && <div className="flex items-center text-sm text-muted-foreground"><Bell className="h-4 w-4 mr-2" /> {t('notification_num')}: {task.notification_num}</div>}
          {task.due_date && <div className={`flex items-center text-sm ${isOverdue ? "text-red-500 font-semibold" : isDueSoon ? "text-yellow-600 font-semibold" : "text-muted-foreground"}`}><CalendarDays className="h-4 w-4 mr-2" /> {t('due')}: {format(dueDateObj!, 'PPP')} {isOverdue && `(${t('overdue')})`} {isDueSoon && !isOverdue && `(${t('due_soon')})`}</div>}
          {task.type_of_work && <div className="flex items-center text-sm text-muted-foreground"><Wrench className="h-4 w-4 mr-2" /> {t('type')}: {t(task.type_of_work.replace(' ', '_').toLowerCase())}</div>}
          {task.equipment_number && <div className="flex items-center text-sm text-muted-foreground"><HardHat className="h-4 w-4 mr-2" /> {t('equipment_number')}: {task.equipment_number}</div>}
          {task.priority && (
            <div className={`flex items-center text-sm ${getPriorityColor(task.priority)}`}>
              <Flag className="h-4 w-4 mr-2" /> {t('priority')}: {t(task.priority)}
            </div>
          )}
          {assignedTechnician && <div className="flex items-center text-sm text-muted-foreground"><User className="h-4 w-4 mr-2" /> {t('assigned_to')}: {assignedTechnician.first_name} {assignedTechnician.last_name}</div>}
          {!task.assignee_id && task.status !== 'unassigned' && <div className="flex items-center text-sm text-muted-foreground"><User className="h-4 w-4 mr-2" /> {t('unassigned')}</div>}
          {task.status === 'completed' && closedByUser && (
            <div className="flex items-center text-sm text-muted-foreground">
              <UserCheck className="h-4 w-4 mr-2" /> {t('closed_by')}: {`${closedByUser.first_name || ''} ${closedByUser.last_name || ''}`.trim() || `(${t(closedByUser.role)})`}
            </div>
          )}
          <TaskPhotoGallery photoBeforeUrl={task.photo_before_url} photoAfterUrl={task.photo_after_url} photoPermitUrl={task.photo_permit_url} />
        </CardContent>
        {canComplete && (
          <CardFooter className="p-0 pt-4 mt-4 border-t">
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleCompleteClick} disabled={isSaving}>
              <CheckCircle className="mr-2 h-4 w-4" /> {t('complete_task')}
            </Button>
          </CardFooter>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;