"use client";

import React from "react";
import { Task } from "@/types/task";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, MoreVertical, MapPin, CalendarDays, Hash, User, Wrench, HardHat, BellRing, CheckCircle, Bell } from "lucide-react";
import { useTasks } from "@/context/TaskContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useSession } from "@/context/SessionContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTechnicians } from "@/hooks/use-technicians";
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from 'react-i18next';
import { useAssignableUsers } from "@/hooks/use-assignable-users";
import PhotoUploader from "./PhotoUploader";
import TaskPhotoGallery from "./TaskPhotoGallery";

interface TaskCardProps {
  task: Task;
  onSelect?: (taskId: string, isSelected: boolean) => void;
  isSelected?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect, isSelected }) => {
  const { changeTaskStatus, deleteTask, updateTask, assignTask } = useTasks();
  const { user, profile: currentUserProfile } = useSession();
  const { technicians } = useTechnicians();
  const { assignableUsers, loading: loadingUsers } = useAssignableUsers();
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTask, setEditedTask] = React.useState<Partial<Task>>(task);
  const [isSaving, setIsSaving] = React.useState(false);
  const [notificationNumError, setNotificationNumError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setEditedTask(task);
    setNotificationNumError(null); // Reset error on task change
  }, [task, isEditing]);

  const isAdmin = currentUserProfile?.role === 'admin';
  const isCompleted = task.status === 'completed';
  const canEditOrDelete = currentUserProfile && ['admin', 'manager', 'supervisor'].includes(currentUserProfile.role);
  const isTechOrContractor = currentUserProfile && ['technician', 'contractor'].includes(currentUserProfile.role);
  const isAssignedToCurrentUser = user && task.assignee_id === user.id;

  const canEditTask = isAdmin || (!isCompleted && (canEditOrDelete || (isTechOrContractor && isAssignedToCurrentUser)));
  const canDeleteTask = isAdmin || (!isCompleted && canEditOrDelete);
  const canComplete = (task.status !== 'completed' && task.status !== 'cancelled') && (isAssignedToCurrentUser || (currentUserProfile && ['admin', 'manager', 'supervisor'].includes(currentUserProfile.role)));

  const validateNotificationNum = (num: string | null | undefined): string | null => {
    if (!num || num.trim() === "") {
      return null; // It's optional during creation/editing, but required for completion
    }
    if (!/^\d+$/.test(num) || num.length !== 10 || !num.startsWith('41')) {
      return t('notification_num_invalid_format');
    }
    return null;
  };

  const handleNotificationNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditedTask({...editedTask, notification_num: value});
    setNotificationNumError(validateNotificationNum(value));
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    if (!editedTask.title || editedTask.title.trim() === "") {
      toast.error(t('task_title_cannot_be_empty'));
      setIsSaving(false);
      return;
    }
    if (!editedTask.equipment_number || editedTask.equipment_number.trim() === "") {
      toast.error(t('equipment_number_mandatory'));
      setIsSaving(false);
      return;
    }

    const numError = validateNotificationNum(editedTask.notification_num);
    if (numError) {
      setNotificationNumError(numError);
      toast.error(numError);
      setIsSaving(false);
      return;
    }

    await updateTask(task.id, editedTask);
    setIsEditing(false);
    toast.success(t('task_updated_successfully'));
    setIsSaving(false);
  };

  const handleDelete = () => {
    deleteTask(task.id);
    toast.success(t('task_deleted_successfully'));
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    const success = await changeTaskStatus(task.id, newStatus);
    if (success) {
      toast.success(t('task_status_changed_to', { status: t(newStatus.replace('-', '_')) }));
    }
  };

  const handleAssignToMe = () => {
    if (user?.id) {
      assignTask(task.id, user.id);
      toast.success(t('task_assigned_to_you'));
    } else {
      toast.error(t('you_must_be_logged_in_to_assign_tasks'));
    }
  };

  const handleUnassign = () => {
    assignTask(task.id, null);
    toast.success(t('task_unassigned'));
  };

  const assignedTechnician = technicians.find(tech => tech.id === task.assignee_id);

  const dueDateObj = task.due_date ? new Date(task.due_date) : null;
  const now = new Date();
  const isOverdue = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj) && task.status !== 'completed' && task.status !== 'cancelled';
  const isDueSoon = dueDateObj && (isToday(dueDateObj) || isTomorrow(dueDateObj) || (dueDateObj > now && dueDateObj <= addDays(now, 2))) && task.status !== 'completed' && task.status !== 'cancelled';

  const googleMapsUrl = task.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}` : null;

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
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('edit_task')}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">{t('task_title')}</Label>
                      <Input id="title" value={editedTask.title || ''} onChange={(e) => setEditedTask({...editedTask, title: e.target.value})} className="col-span-3" disabled={!canEditOrDelete} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">{t('description_optional')}</Label>
                      <Textarea id="description" value={editedTask.description || ""} onChange={(e) => setEditedTask({...editedTask, description: e.target.value})} className="col-span-3" disabled={!canEditOrDelete} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="location" className="text-right">{t('location')}</Label>
                      <Input id="location" value={editedTask.location || ''} onChange={(e) => setEditedTask({...editedTask, location: e.target.value})} className="col-span-3" disabled={!canEditOrDelete} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="taskId" className="text-right">{t('task_id')}</Label>
                      <Input
                        id="taskId"
                        value={editedTask.task_id || ''}
                        className="col-span-3"
                        readOnly
                        disabled={true}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="dueDate" className="text-right">{t('due_date')}</Label>
                      <Input id="dueDate" type="date" value={editedTask.due_date || ''} onChange={(e) => setEditedTask({...editedTask, due_date: e.target.value})} className="col-span-3" disabled={!canEditOrDelete} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="typeOfWork" className="text-right">{t('type_of_work')}</Label>
                      <Select onValueChange={(value: Task['typeOfWork']) => setEditedTask({...editedTask, type_of_work: value})} value={editedTask.type_of_work || ""} disabled={!canEditOrDelete}>
                        <SelectTrigger id="typeOfWork" className="col-span-3">
                          <SelectValue placeholder={t('select_type_of_work')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Correction Maintenance">{t('correction_maintenance')}</SelectItem>
                          <SelectItem value="Civil Work">{t('civil_work')}</SelectItem>
                          <SelectItem value="Overhead Maintenance">{t('overhead_maintenance')}</SelectItem>
                          <SelectItem value="Termination Maintenance">{t('termination_maintenance')}</SelectItem>
                          <SelectItem value="Replacing Equipment">{t('replacing_equipment')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="equipmentNumber" className="text-right">{t('equipment_number')}</Label>
                      <Input id="equipmentNumber" value={editedTask.equipment_number || ''} onChange={(e) => setEditedTask({...editedTask, equipment_number: e.target.value})} className="col-span-3" disabled={!canEditOrDelete} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="notificationNum" className="text-right">{t('notification_num')}</Label>
                      <Input
                        id="notificationNum"
                        value={editedTask.notification_num || ''}
                        onChange={handleNotificationNumChange}
                        className="col-span-3"
                        maxLength={10}
                        disabled={!canEditOrDelete}
                      />
                      {notificationNumError && <p className="col-span-4 text-right text-destructive text-sm">{notificationNumError}</p>}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="assignee" className="text-right">{t('assign_to')}</Label>
                      <Select onValueChange={(value) => setEditedTask({...editedTask, assignee_id: value === "unassigned" ? null : value})} value={editedTask.assignee_id || "unassigned"} disabled={!canEditOrDelete}>
                        <SelectTrigger id="assignee" className="col-span-3">
                          <SelectValue placeholder={t('select_a_user_to_assign')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
                          {currentUserProfile && ['supervisor', 'technician'].includes(currentUserProfile.role) && (
                            <SelectItem value={currentUserProfile.id}>
                              {t('assign_to_me')} ({currentUserProfile.first_name})
                            </SelectItem>
                          )}
                          {loadingUsers ? (
                            <SelectItem value="loading" disabled>{t('loading_users')}...</SelectItem>
                          ) : (
                            assignableUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.first_name} {user.last_name} ({t(user.role)})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {isTechOrContractor && (
                      <>
                        <PhotoUploader
                          label={t('before_work_photo')}
                          taskId={task.id}
                          photoType="before"
                          currentUrl={editedTask.photo_before_url}
                          onUploadSuccess={(url) => setEditedTask({...editedTask, photo_before_url: url})}
                          onRemove={() => setEditedTask({...editedTask, photo_before_url: null})}
                        />
                        <PhotoUploader
                          label={t('after_work_photo')}
                          taskId={task.id}
                          photoType="after"
                          currentUrl={editedTask.photo_after_url}
                          onUploadSuccess={(url) => setEditedTask({...editedTask, photo_after_url: url})}
                          onRemove={() => setEditedTask({...editedTask, photo_after_url: null})}
                        />
                        <PhotoUploader
                          label={t('permit_photo')}
                          taskId={task.id}
                          photoType="permit"
                          currentUrl={editedTask.photo_permit_url}
                          onUploadSuccess={(url) => setEditedTask({...editedTask, photo_permit_url: url})}
                          onRemove={() => setEditedTask({...editedTask, photo_permit_url: null})}
                        />
                      </>
                    )}
                  </div>
                  <Button onClick={handleSaveEdit} disabled={isSaving || !!notificationNumError}>{t('save_changes')}</Button>
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
                <DropdownMenuItem onClick={() => handleStatusChange('unassigned')} disabled={isCompleted && !isAdmin}>{t('mark_as_unassigned')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('assigned')} disabled={isCompleted && !isAdmin}>{t('mark_as_assigned')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('in-progress')} disabled={isCompleted && !isAdmin}>{t('mark_as_in_progress')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('completed')} disabled={isCompleted && !isAdmin}>{t('mark_as_completed')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('cancelled')} disabled={isCompleted && !isAdmin}>{t('mark_as_cancelled')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                {user && !isAssignedToCurrentUser && <DropdownMenuItem onClick={handleAssignToMe} disabled={isCompleted && !isAdmin}>{t('assign_to_me')}</DropdownMenuItem>}
                {user && isAssignedToCurrentUser && <DropdownMenuItem onClick={handleUnassign} disabled={isCompleted && !isAdmin}>{t('unassign')}</DropdownMenuItem>}
                {canDeleteTask && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
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
          {task.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              {googleMapsUrl ? (
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
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
          {assignedTechnician && <div className="flex items-center text-sm text-muted-foreground"><User className="h-4 w-4 mr-2" /> {t('assigned_to')}: {assignedTechnician.first_name} {assignedTechnician.last_name}</div>}
          {!task.assignee_id && task.status !== 'unassigned' && <div className="flex items-center text-sm text-muted-foreground"><User className="h-4 w-4 mr-2" /> {t('unassigned')}</div>}
          <TaskPhotoGallery photoBeforeUrl={task.photo_before_url} photoAfterUrl={task.photo_after_url} photoPermitUrl={task.photo_permit_url} />
        </CardContent>
        {canComplete && (
          <CardFooter className="p-0 pt-4 mt-4 border-t">
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange('completed')} disabled={isSaving}>
              <CheckCircle className="mr-2 h-4 w-4" /> {t('complete_task')}
            </Button>
          </CardFooter>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;