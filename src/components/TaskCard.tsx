"use client";

import React, { memo } from "react";
import { Task } from "@/types/task";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, MoreVertical, MapPin, CalendarDays, Hash, User, Wrench, HardHat, BellRing, CheckCircle, Bell, Flag, UserCheck, Clock, Share2, UserPlus } from "lucide-react";
import { useTasks } from "@/context/TaskContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useSession } from "@/context/SessionContext";
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';
import TaskPhotoGallery from "./TaskPhotoGallery";
import EditTaskForm from "./EditTaskForm";
import { useProfiles, ProfileWithEmail } from "@/hooks/use-profiles"; // Import ProfileWithEmail
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toastSuccess, toastError, toastInfo, toastWarning, toastLoading, dismissToast } from '@/utils/toast'; // Import new toast helpers

interface TaskCardProps {
  taskId: string;
  onSelect?: (taskId: string, isSelected: boolean) => void;
  isSelected?: boolean;
}

const googleMapsUrlRegex = /^(https:\/\/www\.google\.com\/maps\?q=(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)|https:\/\/maps\.app\.goo\.gl\/[a-zA-Z0-9]+)$/;

const validateLocationUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === "") return null;
  if (!googleMapsUrlRegex.test(url)) return "location_url_invalid_format";
  return null;
};

const TaskCard: React.FC<TaskCardProps> = memo(({ taskId, onSelect, isSelected }) => {
  const { tasksByIdMap, changeTaskStatus, deleteTask, assignTask, restoreTask } = useTasks();
  const { user, profile: currentUserProfile } = useSession();
  const { profiles } = useProfiles(); // profiles is now ProfileWithEmail[]
  const { t } = useTranslation();

  const task = tasksByIdMap.get(taskId);
  if (!task) return null;

  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showRevertConfirmation, setShowRevertConfirmation] = React.useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = React.useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false); // New state for delete confirmation

  const isAdmin = currentUserProfile?.role === 'admin';
  const isCompleted = task.status === 'completed';
  const isCurrentlyAssigned = !!task.assignee_id;
  const isDueDatePassed = task.due_date ? isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'completed' && task.status !== 'cancelled' : false;
  const isCurrentUserAssigned = user && task.assignee_id === user.id;
  const isPrivilegedReassigner = currentUserProfile && ['admin', 'manager', 'supervisor'].includes(currentUserProfile.role);
  const isCreator = user && task.creator_id === user.id;

  // New Status Flow Logic:
  const isPending = task.status === 'unassigned' || task.status === 'assigned';
  const isInProgress = task.status === 'in-progress';
  
  // RESTRICTION: Only the assigned user OR an Admin can start progress.
  const canStartProgress = isPending && (isCurrentUserAssigned || (isAdmin && isCurrentlyAssigned));
  
  const canComplete = isInProgress && (isCurrentUserAssigned || isAdmin);
  
  // Editing/Deleting permissions remain largely the same, but adjusted for the new flow
  const canEditOrDelete = isAdmin || (!isCompleted && (isPrivilegedReassigner || isCurrentUserAssigned));
  const canEditTask = canEditOrDelete;
  const canDeleteTask = currentUserProfile && ['admin', 'manager'].includes(currentUserProfile.role);
  
  const canCancel = (isCreator || (currentUserProfile && ['admin', 'manager'].includes(currentUserProfile.role))) &&
                    (isPending || isInProgress);
  
  const canShare = typeof navigator !== 'undefined' && navigator.share;
  const canAssignToMe = user && !isCurrentlyAssigned && (!isCompleted || isAdmin);
  const canUnassignTask = isCurrentlyAssigned && (isCurrentUserAssigned || isAdmin);

  const confirmDelete = React.useCallback(async () => {
    setShowDeleteConfirmation(false);
    setIsSaving(true);
    const loadingToastId = toastLoading(t('deleting'));
    const deletedTask = await deleteTask(task.id);
    setIsSaving(false);
    dismissToast(loadingToastId);

    if (deletedTask) {
      toastInfo(t('task_deleted_successfully'), {
        action: {
          label: t('undo'),
          onClick: async () => {
            setIsSaving(true);
            const restoreLoadingToastId = toastLoading(t('restoring_task'));
            await restoreTask(deletedTask);
            setIsSaving(false);
            dismissToast(restoreLoadingToastId);
          },
        },
        duration: 5000, // Toast visible for 5 seconds to allow undo
      });
    }
  }, [deleteTask, restoreTask, task, t]);

  const handleDeleteClick = React.useCallback(() => {
    setShowDeleteConfirmation(true);
  }, []);

  const handleStatusChange = React.useCallback(async (newStatus: Task['status']) => {
    if (task.status === 'completed' && newStatus === 'in-progress') {
      setShowRevertConfirmation(true);
      return;
    }
    if (newStatus === 'cancelled') {
      setShowCancelConfirmation(true);
      return;
    }
    setIsSaving(true);
    const loadingToastId = toastLoading(t('updating_status'));
    const success = await changeTaskStatus(task.id, newStatus);
    if (success) toastSuccess(t('task_status_changed_to', { status: t(newStatus.replace('-', '_')).replace('-', ' ') }));
    setIsSaving(false);
    dismissToast(loadingToastId);
  }, [changeTaskStatus, task.id, task.status, t]);

  const confirmRevertToInProgress = React.useCallback(async () => {
    setIsSaving(true);
    const loadingToastId = toastLoading(t('reverting'));
    const success = await changeTaskStatus(task.id, 'in-progress');
    if (success) toastSuccess(t('task_status_changed_to', { status: t('in_progress').replace('-', ' ') }));
    setIsSaving(false);
    dismissToast(loadingToastId);
    setShowRevertConfirmation(false);
  }, [changeTaskStatus, task.id, t]);

  const confirmCancelTask = React.useCallback(async () => {
    setIsSaving(true);
    const loadingToastId = toastLoading(t('cancelling'));
    const success = await changeTaskStatus(task.id, 'cancelled');
    if (success) toastSuccess(t('task_status_changed_to', { status: t('cancelled') }));
    setIsSaving(false);
    dismissToast(loadingToastId);
    setShowCancelConfirmation(false);
  }, [changeTaskStatus, task.id, t]);

  const handleCompleteClick = React.useCallback(async () => {
    const missingFields = [];
    if (!task.photo_before_urls || task.photo_before_urls.length === 0) missingFields.push(t('before_work_photo'));
    if (!task.photo_after_urls || task.photo_after_urls.length === 0) missingFields.push(t('after_work_photo'));
    if (!task.photo_permit_url) missingFields.push(t('permit_photo'));
    if (!task.notification_num) missingFields.push(t('notification_num'));

    if (missingFields.length > 0) {
      toastError(t('please_fill_in_the_following_fields', { fields: missingFields.join(', ') }));
      setIsEditing(true);
    } else {
      await handleStatusChange('completed');
    }
  }, [task, handleStatusChange, t]);

  const handleAssignToMe = React.useCallback(async () => {
    setIsSaving(true);
    const loadingToastId = toastLoading(t('assigning_task'));
    if (user?.id) {
      const success = await assignTask(task.id, user.id);
      if (success) toastSuccess(t('task_assigned_to_you'));
    } else {
      toastError(t('you_must_be_logged_in_to_assign_tasks'));
    }
    setIsSaving(false);
    dismissToast(loadingToastId);
  }, [assignTask, task.id, user, t]);

  const handleUnassign = React.useCallback(async () => {
    setIsSaving(true);
    const loadingToastId = toastLoading(t('unassigning_task'));
    const success = await assignTask(task.id, null);
    if (success) toastSuccess(t('task_unassigned'));
    setIsSaving(false);
    dismissToast(loadingToastId);
  }, [assignTask, task.id, t]);

  const handleShare = React.useCallback(async () => {
    if (!canShare) {
      toastError(t('share_not_supported'));
      return;
    }
    const assignedUser = (profiles as ProfileWithEmail[]).find(p => p.id === task.assignee_id);
    const taskDetails = [
      `*${t('task_title')}*: ${task.title}`,
      task.description ? `${t('description_optional')}: ${task.description}` : '',
      task.due_date ? `${t('due_date')}: ${format(new Date(task.due_date), 'PPP')}` : '',
      task.location ? `${t('location')}: ${task.location}` : '',
      task.equipment_number ? `${t('equipment_number')}: ${task.equipment_number}` : '',
      task.notification_num ? `${t('notification_num')}: ${task.notification_num}` : '',
      task.priority ? `${t('priority')}: ${t(task.priority)}` : '',
      assignedUser ? `${t('assigned_to')}: ${assignedUser.first_name} ${assignedUser.last_name}` : `${t('assigned_to')}: ${t('unassigned')}`
    ].filter(Boolean).join('\n');
    try {
      await navigator.share({ title: t('task_details_title', { title: task.title }), text: taskDetails });
    } catch (error: any) {
      if (error.name !== 'AbortError') toastError(t('share_failed'));
    }
  }, [canShare, task, profiles, t]);

  const assignedUser = (profiles as ProfileWithEmail[]).find(p => p.id === task.assignee_id);
  const assignedByUser = (profiles as ProfileWithEmail[]).find(p => p.id === task.assigned_by_id); // Find the user who assigned it
  const closedByUser = (profiles as ProfileWithEmail[]).find(p => p.id === task.closed_by_id);
  const dueDateObj = task.due_date ? new Date(task.due_date) : null;
  const now = new Date();
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

  const getStatusDisplay = () => {
    if (task.status === 'unassigned' || task.status === 'assigned') {
      return {
        text: t('pending'),
        color: 'bg-yellow-100 text-yellow-800',
      };
    }
    switch (task.status) {
      case 'completed': return { text: t('completed'), color: 'bg-green-100 text-green-800' };
      case 'in-progress': return { text: t('in_progress').replace('-', ' '), color: 'bg-blue-100 text-blue-800' };
      case 'cancelled': return { text: t('cancelled'), color: 'bg-red-100 text-red-800' };
      default: return { text: t('unassigned'), color: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusDisplay = getStatusDisplay();

  const DetailLine: React.FC<{ icon: React.ReactNode; text: React.ReactNode; className?: string }> = ({ icon, text, className = "text-muted-foreground" }) => (
    <div className={`flex items-start text-xs ${className}`}>
      {React.cloneElement(icon as React.ReactElement, { className: "h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0" })}
      <span className="break-words min-w-0">{text}</span>
    </div>
  );

  return (
    <Card className={cn(
      "w-full flex items-start p-4",
      "shadow-sm border border-gray-200 dark:border-border/50", // Improved light theme separation
      isCompleted && "opacity-70",
      task.status === 'cancelled' && "border-destructive",
      isDueDatePassed && "border-red-500 ring-2 ring-red-500",
      isDueSoon && !isDueDatePassed && "border-yellow-500 ring-2 ring-yellow-500"
    )}>
      {onSelect && (
        <div className="mr-2 mt-1.5 flex items-center justify-center h-11 w-11"> {/* 44x44 tap target */}
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={(checked) => onSelect(task.id, checked === true)} 
            id={`task-select-${task.id}`}
            className="h-5 w-5" // Actual checkbox size
          />
        </div>
      )}
      <div className="flex-grow min-w-0">
        <CardHeader className="p-0 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2 min-w-0">
              <CardTitle className={`text-base font-semibold break-words ${isCompleted ? "line-through" : ""}`}>{task.title}</CardTitle>
            </div>
            <div className="flex items-center flex-shrink-0 -mt-1 -mr-2"> {/* Adjust margin to pull actions closer to the edge */}
              {canEditTask && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10"> {/* 40x40 tap target */}
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>{t('edit_task')}</DialogTitle></DialogHeader>
                    <EditTaskForm task={task} onClose={() => setIsEditing(false)} canEditOrDelete={canEditOrDelete} canComplete={canComplete} />
                  </DialogContent>
                </Dialog>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10"> {/* 40x40 tap target */}
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Start Progress is the primary action for pending tasks */}
                  {canStartProgress && <DropdownMenuItem onClick={() => handleStatusChange('in-progress')} disabled={isSaving}>{t('ready_to_perform')}</DropdownMenuItem>}
                  {isCompleted && <DropdownMenuItem onClick={() => handleStatusChange('in-progress')} disabled={isSaving}>{t('revert_to_in_progress').replace('-', ' ')}</DropdownMenuItem>}
                  {canCancel && <DropdownMenuItem onClick={() => handleStatusChange('cancelled')} disabled={isSaving}>{t('mark_as_cancelled')}</DropdownMenuItem>}
                  
                  {(canStartProgress || canCancel || isCompleted) && (canAssignToMe || canUnassignTask || canDeleteTask || canShare) && <DropdownMenuSeparator />}
                  
                  {canAssignToMe && <DropdownMenuItem onClick={handleAssignToMe} disabled={isSaving}>{t('assign_to_me')}</DropdownMenuItem>}
                  {canUnassignTask && <DropdownMenuItem onClick={handleUnassign} disabled={isSaving}>{t('unassign')}</DropdownMenuItem>}
                  
                  {(canAssignToMe || canUnassignTask) && (canDeleteTask || canShare) && <DropdownMenuSeparator />}
                  
                  {canShare && <DropdownMenuItem onClick={handleShare}><Share2 className="h-4 w-4 mr-2" /> {t('share')}</DropdownMenuItem>}
                  {canDeleteTask && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={handleDeleteClick} className="text-destructive" disabled={isSaving}><Trash2 className="h-4 w-4 mr-2" /> {t('delete')}</DropdownMenuItem></>)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusDisplay.color}`}>{statusDisplay.text}</span>
            {isDueDatePassed && <BellRing className="h-4 w-4 text-red-500 animate-pulse" />}
            {isDueSoon && !isDueDatePassed && <BellRing className="h-4 w-4 text-yellow-500" />}
          </div>
        </CardHeader>
          <CardContent className="space-y-1 p-0 pt-2">
            {task.description && <p className={`text-xs text-gray-700 dark:text-gray-300 ${isCompleted ? "line-through" : ""}`}>{task.description}</p>}
            <div className="space-y-1 pt-1">
              <DetailLine icon={<Clock />} text={`${t('created_on')}: ${format(new Date(task.created_at), 'PPP p')}`} />
              {task.location && <DetailLine icon={<MapPin />} text={validateLocationUrl(task.location) === null ? <a href={task.location} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{task.location}</a> : task.location} />}
              {task.task_id && <DetailLine icon={<Hash />} text={`${t('task_id')}: ${task.task_id}`} />}
              {task.notification_num && <DetailLine icon={<Bell />} text={`${t('notification_num')}: ${task.notification_num}`} />}
              {task.due_date && <DetailLine icon={<CalendarDays />} text={`${t('due_date')}: ${format(dueDateObj!, 'PPP')} ${isDueDatePassed ? `(${t('overdue')})` : ''} ${isDueSoon && !isDueDatePassed ? `(${t('due_soon')})` : ''}`} className={isDueDatePassed ? "text-red-500 font-semibold" : isDueSoon ? "text-yellow-600 font-semibold" : "text-muted-foreground"} />}
              {task.type_of_work && <DetailLine icon={<Wrench />} text={`${t('type')}: ${t(task.type_of_work.replace(' ', '_').toLowerCase())}`} />}
              {task.equipment_number && <DetailLine icon={<HardHat />} text={`${t('equipment_number')}: ${task.equipment_number}`} />}
              {task.priority && <DetailLine icon={<Flag />} text={`${t('priority')}: ${t(task.priority)}`} className={getPriorityColor(task.priority)} />}
              {assignedUser && <DetailLine icon={<User />} text={`${t('assigned_to')}: ${assignedUser.first_name} ${assignedUser.last_name}`} />}
              {!task.assignee_id && <DetailLine icon={<User />} text={t('unassigned')} />}
              {assignedByUser && task.assignee_id && task.assigned_by_id && (
                <DetailLine icon={<UserPlus />} text={`${t('assigned_by')}: ${assignedByUser.first_name} ${assignedByUser.last_name}`} />
              )}
              {isCompleted && closedByUser && <DetailLine icon={<UserCheck />} text={`${t('closed_by')}: ${`${closedByUser.first_name || ''} ${closedByUser.last_name || ''}`.trim() || `(${t(closedByUser.role)})`}`} />}
              {isCompleted && task.closed_at && <DetailLine icon={<CalendarDays />} text={`${t('closed_on')}: ${format(new Date(task.closed_at), 'PPP p')}`} />}
            </div>
            {isInProgress && <TaskPhotoGallery photoBeforeUrls={task.photo_before_urls} photoAfterUrls={task.photo_after_urls} photoPermitUrl={task.photo_permit_url} />}
          </CardContent>
        {/* Primary Action Button */}
        <CardFooter className="p-0 pt-4 mt-4 border-t">
          {canStartProgress && (
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusChange('in-progress')} disabled={isSaving}>
              <Wrench className="mr-2 h-4 w-4" /> {t('ready_to_perform')}
            </Button>
          )}
          {canComplete && (
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleCompleteClick} disabled={isSaving}>
              <CheckCircle className="mr-2 h-4 w-4" /> {t('complete_task')}
            </Button>
          )}
        </CardFooter>
      </div>
      <AlertDialog open={showRevertConfirmation} onOpenChange={setShowRevertConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('confirm_revert_task_title')}</AlertDialogTitle><AlertDialogDescription>{t('confirm_revert_task_description', { title: task.title })}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={confirmRevertToInProgress} disabled={isSaving}>{isSaving ? t('reverting') : t('revert_to_in_progress_action')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showCancelConfirmation} onOpenChange={setShowCancelConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('confirm_cancel_task_title')}</AlertDialogTitle><AlertDialogDescription>{t('confirm_cancel_task_description', { title: task.title })}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={confirmCancelTask} disabled={isSaving}>{isSaving ? t('cancelling') : t('confirm_cancel_action')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* New Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm_delete_task_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirm_delete_task_description', { title: task.title })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isSaving} className="bg-red-600 text-destructive-foreground hover:bg-red-600/90">
              {isSaving ? t('deleting') : t('confirm_delete_action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}, (prevProps, nextProps) => prevProps.taskId === nextProps.taskId && prevProps.isSelected === nextProps.isSelected);

TaskCard.displayName = 'TaskCard';

export default TaskCard;