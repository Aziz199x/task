"use client";

import React from "react";
import { Task } from "@/types/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, MoreVertical, MapPin, CalendarDays, Hash, User, Wrench, HardHat, BellRing } from "lucide-react";
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
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface TaskCardProps {
  task: Task;
  onSelect?: (taskId: string, isSelected: boolean) => void;
  isSelected?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect, isSelected }) => {
  const { changeTaskStatus, deleteTask, updateTask, assignTask } = useTasks();
  const { user } = useSession();
  const { technicians, loading: loadingTechnicians } = useTechnicians();
  const { t } = useTranslation(); // Initialize useTranslation

  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(task.title);
  const [editedDescription, setEditedDescription] = React.useState(task.description || "");
  const [editedLocation, setEditedLocation] = React.useState(task.location || "");
  const [editedWorkOrderNumber, setEditedWorkOrderNumber] = React.useState(task.workOrderNumber || "");
  const [editedDueDate, setEditedDueDate] = React.useState(task.dueDate || "");
  const [editedAssigneeId, setEditedAssigneeId] = React.useState<string | null>(task.assigneeId || null);
  const [editedTypeOfWork, setEditedTypeOfWork] = React.useState<Task['typeOfWork'] | undefined>(task.typeOfWork);
  const [editedEquipmentNumber, setEditedEquipmentNumber] = React.useState(task.equipmentNumber);

  const handleSaveEdit = () => {
    if (editedTitle.trim() === "") {
      toast.error(t('task_title_cannot_be_empty'));
      return;
    }
    if (editedEquipmentNumber.trim() === "") {
      toast.error(t('equipment_number_mandatory'));
      return;
    }
    updateTask(task.id, editedTitle, editedDescription, editedLocation, editedWorkOrderNumber, editedDueDate, editedAssigneeId, editedTypeOfWork, editedEquipmentNumber);
    setIsEditing(false);
    toast.success(t('task_updated_successfully'));
  };

  const handleDelete = () => {
    deleteTask(task.id);
    toast.success(t('task_deleted_successfully'));
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    changeTaskStatus(task.id, newStatus);
    toast.success(t('task_status_changed_to', { status: t(newStatus.replace('-', '_')) }));
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

  const isAssignedToCurrentUser = user && task.assigneeId === user.id;
  const assignedTechnician = technicians.find(tech => tech.id === task.assigneeId);

  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const now = new Date();
  const isOverdue = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj) && task.status !== 'completed' && task.status !== 'cancelled';
  const isDueSoon = dueDateObj && (isToday(dueDateObj) || isTomorrow(dueDateObj) || (dueDateObj > now && dueDateObj <= addDays(now, 2))) && task.status !== 'completed' && task.status !== 'cancelled';

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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <CardTitle className={`text-lg font-semibold ${task.status === 'completed' ? "line-through" : ""}`}>
              {task.title}
            </CardTitle>
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${
              task.status === 'completed' ? 'bg-green-100 text-green-800' :
              task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
              task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
              task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {t(task.status.replace('-', '_'))} {/* Translate status */}
            </span>
            {isOverdue && <BellRing className="h-4 w-4 text-red-500 animate-pulse" />}
            {isDueSoon && !isOverdue && <BellRing className="h-4 w-4 text-yellow-500" />}
          </div>
          <div className="flex space-x-2">
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
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">{t('task_title')}</Label>
                    <Input id="title" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">{t('description_optional')}</Label>
                    <Textarea id="description" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location" className="text-right">{t('location')}</Label>
                    <Input id="location" value={editedLocation} onChange={(e) => setEditedLocation(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="workOrderNumber" className="text-right">{t('work_order_number')}</Label>
                    <Input id="workOrderNumber" value={editedWorkOrderNumber} onChange={(e) => setEditedWorkOrderNumber(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dueDate" className="text-right">{t('due_date')}</Label>
                    <Input id="dueDate" type="date" value={editedDueDate} onChange={(e) => setEditedDueDate(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="typeOfWork" className="text-right">{t('type_of_work')}</Label>
                    <Select onValueChange={(value: Task['typeOfWork']) => setEditedTypeOfWork(value)} value={editedTypeOfWork || ""}>
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
                    <Input id="equipmentNumber" value={editedEquipmentNumber} onChange={(e) => setEditedEquipmentNumber(e.target.value)} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="assignee" className="text-right">{t('assignee')}</Label>
                    <Select onValueChange={(value) => setEditedAssigneeId(value === "unassigned" ? null : value)} value={editedAssigneeId || "unassigned"}>
                      <SelectTrigger id="assignee" className="col-span-3">
                        <SelectValue placeholder={t('select_a_technician')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
                        {loadingTechnicians ? (
                          <SelectItem value="loading" disabled>{t('loading_technicians')}...</SelectItem>
                        ) : (
                          technicians.map((tech) => (
                            <SelectItem key={tech.id} value={tech.id}>
                              {tech.first_name} {tech.last_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSaveEdit}>{t('save_changes')}</Button>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange('unassigned')}>
                  {t('mark_as_unassigned')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('assigned')}>
                  {t('mark_as_assigned')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('in-progress')}>
                  {t('mark_as_in_progress')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                  {t('mark_as_completed')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('cancelled')}>
                  {t('mark_as_cancelled')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user && !isAssignedToCurrentUser && (
                  <DropdownMenuItem onClick={handleAssignToMe}>
                    {t('assign_to_me')}
                  </DropdownMenuItem>
                )}
                {user && isAssignedToCurrentUser && (
                  <DropdownMenuItem onClick={handleUnassign}>
                    {t('unassign')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> {t('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {task.description && (
            <p className={`text-sm text-muted-foreground ${task.status === 'completed' ? "line-through" : ""}`}>
              {task.description}
            </p>
          )}
          {task.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" /> {task.location}
            </div>
          )}
          {task.workOrderNumber && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Hash className="h-4 w-4 mr-2" /> {task.workOrderNumber}
            </div>
          )}
          {task.dueDate && (
            <div className={`flex items-center text-sm ${isOverdue ? "text-red-500 font-semibold" : isDueSoon ? "text-yellow-600 font-semibold" : "text-muted-foreground"}`}>
              <CalendarDays className="h-4 w-4 mr-2" /> {t('due')}: {format(dueDateObj!, 'PPP')} {isOverdue && `(${t('overdue')})`} {isDueSoon && !isOverdue && `(${t('due_soon')})`}
            </div>
          )}
          {task.typeOfWork && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Wrench className="h-4 w-4 mr-2" /> {t('type')}: {t(task.typeOfWork.replace(' ', '_').toLowerCase())}
            </div>
          )}
          {task.equipmentNumber && (
            <div className="flex items-center text-sm text-muted-foreground">
              <HardHat className="h-4 w-4 mr-2" /> {t('equipment_number')}: {task.equipmentNumber}
            </div>
          )}
          {assignedTechnician && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-2" /> {t('assigned_to')}: {assignedTechnician.first_name} {assignedTechnician.last_name}
            </div>
          )}
          {!task.assigneeId && task.status !== 'unassigned' && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-2" /> {t('unassigned')}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};

export default TaskCard;