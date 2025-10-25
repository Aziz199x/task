"use client";

import React from "react";
import { Task } from "@/types/task";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, MoreVertical, MapPin, CalendarDays, Hash, User, Wrench, HardHat, BellRing, CheckCircle, Bell, Flag, UserCheck, Clock, Share2 } from "lucide-react";
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

  const canComplete = (task.status !== 'completed' && task.status !== 'cancelled') && (isAssignedToCurrentUser || isAdmin);
  const canEditTask = isAdmin || (!isCompleted && (canEditOrDelete || (isTechOrContractor && isAssignedToCurrentUser)));
  const canDeleteTask = currentUserProfile && ['admin', 'manager'].includes(currentUserProfile.role);
  const canUnassignTask = (isAdmin || isCreator) && task.assignee_id !== null;
  const canStartProgress = (isAssignedToCurrentUser || canEditOrDelete) && task.status === 'assigned';
  const canCancel = isCreator || (currentUserProfile && ['admin', 'manager'].includes(currentUserProfile.role));
  const canShare = typeof navigator !== 'undefined' && navigator.share;

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

  const handleShare = async () => {
    if (!canShare) {
      toast.error(t('share_not_supported'));
      return;
    }

    const assignedTechnician = technicians.find(tech => tech.id === task.assignee_id);
    const taskDetails = [
      `*${t('task_title')}*: ${task.title}`,
      task.description ? `${t('description_optional')}: ${task.description}` : '',
      task.due_date ? `${t('due_date')}: ${format(new Date(task.due_date), 'PPP')}` : '',
      task.location ? `${t('location')}: ${task.location}` : '',
      task.equipment_number ? `${t('equipment_number')}: ${task.equipment_number}` : '',
      task.notification_num ? `${t('notification_num')}: ${task.notification_num}` : '',
      task.priority ? `${t('priority')}: ${t(task.priority)}` : '',
      assignedTechnician ? `${t('assigned_to')}: ${assignedTechnician.first_name} ${assignedTechnician.last_name}` : `${t('assigned_to')}: ${t('unassigned')}`
    ].filter(Boolean).join('\n');

    try {
      await navigator.share({
        title: t('task_details_title', { title: task.title }),
        text: taskDetails,
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast.error(t('share_failed'));
      }
    }
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
          <CardTitle className={`text-lg font-semibold ${task.status === 'completed' ? "line-through" : ""}`}>
            {task.title}
          </CardTitle>
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
                {canStartProgress && (
                  <DropdownMenuItem onClick={() => handleStatusChange('in-progress')} disabled={isCompleted && !isAdmin || isSaving}>{t('mark_as_in_progress')}</DropdownMenuItem>
                )}
                {canCancel && (
                  <DropdownMenuItem onClick={() => handleStatusChange('cancelled')} disabled={isCompleted && !isAdmin || isSaving}>{t('mark_as_cancelled')}</DropdownMenuItem>
                )}

                {(canStartProgress || canCancel) && ((user && !isAssignedToCurrentUser) || canUnassignTask || canDeleteTask || canShare) && <DropdownMenuSeparator />}

                {user && !isAssignedToCurrentUser && <DropdownMenuItem onClick={handleAssignToMe} disabled={isCompleted && !isAdmin || isSaving}>{t('assign_to_me')}</DropdownMenuItem>}
                {canUnassignTask && <DropdownMenuItem onClick={handleUnassign} disabled={isCompleted && !isAdmin || isSaving}>{t('unassign')}</DropdownMenuItem>}

                {((user && !isAssignedToCurrentUser) || canUnassignTask) && (canDeleteTask || canShare) && <DropdownMenuSeparator />}

                {canShare && (
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" /> {t('share')}
                  </DropdownMenuItem>
                )}

                {canDeleteTask && (
                  <>
                    {canShare && <DropdownMenuSeparator />}
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive" disabled={isSaving}>
                      <Trash2 className="h-4 w-4 mr-2" /> {t('delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          {task.description && <p className={`text-sm text-muted-foreground mb-2 ${task.status === 'completed' ? "line-through" : ""}`}>{task.description}</p>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t text-sm text-muted-foreground">
            <div className="flex items-center min-w-0">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate" title={format(new Date(task.created_at), 'PPP p')}>{t('created_on')}: {format(new Date(task.created_at), 'P')}</span>
            </div>

            {task.due_date && 
              <div className={`flex items-center min-w-0 ${isOverdue ? "text-red-500 font-semibold" : isDueSoon ? "text-yellow-600 font-semibold" : ""}`}>
                <CalendarDays className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate" title={format(dueDateObj!, 'PPP')}>{t('due')}: {format(dueDateObj!, 'P')}</span>
              </div>
            }

            {task.task_id && 
              <div className="flex items-center min-w-0">
                <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate" title={task.task_id}>{t('task_id')}: {task.task_id}</span>
              </div>
            }

            {task.notification_num && 
              <div className="flex items-center min-w-0">
                <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate" title={task.notification_num}>{t('notification_num')}: {task.notification_num}</span>
              </div>
            }

            {task.equipment_number && 
              <div className="flex items-center min-w-0">
                <HardHat className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate" title={task.equipment_number}>{t('equipment_number')}: {task.equipment_number}</span>
              </div>
            }

            {task.type_of_work && 
              <div className="flex items-center min-w-0">
                <Wrench className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t('type')}: {t(task.type_of_work.replace(/ /g, '_').toLowerCase())}</span>
              </div>
            }

            {task.priority && (
              <div className={`flex items-center min-w-0 ${getPriorityColor(task.priority)}`}>
                <Flag className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t('priority')}: {t(task.priority)}</span>
              </div>
            )}

            {assignedTechnician && 
              <div className="flex items-center min-w-0">
                <User className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t('assigned_to')}: {assignedTechnician.first_name} {assignedTechnician.last_name}</span>
              </div>
            }

            {!task.assignee_id && task.status !== 'unassigned' && 
              <div className="flex items-center min-w-0">
                <User className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t('unassigned')}</span>
              </div>
            }

            {task.status === 'completed' && closedByUser && (
              <div className="flex items-center min-w-0">
                <UserCheck className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t('closed_by')}: {`${closedByUser.first_name || ''} ${closedByUser.last_name || ''}`.trim() || `(${t(closedByUser.role)})`}</span>
              </div>
            )}
          </div>

          {task.location && (
            <div className="flex items-center text-sm text-muted-foreground pt-2 mt-2 border-t">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              {validateLocationUrl(task.location) === null ? (
                <a href={task.location} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary truncate">
                  {task.location}
                </a>
              ) : (
                <span className="truncate">{task.location}</span>
              )}
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