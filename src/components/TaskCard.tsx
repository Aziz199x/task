"use client";

import React from "react";
import { Task } from "@/types/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, MoreVertical, MapPin, CalendarDays, Hash, User, Wrench, HardHat } from "lucide-react"; // Added HardHat icon
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

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { changeTaskStatus, deleteTask, updateTask, assignTask } = useTasks();
  const { user } = useSession();
  const { technicians, loading: loadingTechnicians } = useTechnicians();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(task.title);
  const [editedDescription, setEditedDescription] = React.useState(task.description || "");
  const [editedLocation, setEditedLocation] = React.useState(task.location || "");
  const [editedWorkOrderNumber, setEditedWorkOrderNumber] = React.useState(task.workOrderNumber || "");
  const [editedDueDate, setEditedDueDate] = React.useState(task.dueDate || "");
  const [editedAssigneeId, setEditedAssigneeId] = React.useState<string | null>(task.assigneeId || null);
  const [editedTypeOfWork, setEditedTypeOfWork] = React.useState<Task['typeOfWork'] | undefined>(task.typeOfWork);
  const [editedEquipmentNumber, setEditedEquipmentNumber] = React.useState(task.equipmentNumber); // New state for equipment number

  const handleSaveEdit = () => {
    if (editedTitle.trim() === "") {
      toast.error("Task title cannot be empty.");
      return;
    }
    if (editedEquipmentNumber.trim() === "") {
      toast.error("Equipment number is mandatory.");
      return;
    }
    updateTask(task.id, editedTitle, editedDescription, editedLocation, editedWorkOrderNumber, editedDueDate, editedAssigneeId, editedTypeOfWork, editedEquipmentNumber);
    setIsEditing(false);
    toast.success("Task updated successfully!");
  };

  const handleDelete = () => {
    deleteTask(task.id);
    toast.success("Task deleted successfully!");
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    changeTaskStatus(task.id, newStatus);
    toast.success(`Task status changed to ${newStatus}!`);
  };

  const handleAssignToMe = () => {
    if (user?.id) {
      assignTask(task.id, user.id);
      toast.success("Task assigned to you!");
    } else {
      toast.error("You must be logged in to assign tasks.");
    }
  };

  const handleUnassign = () => {
    assignTask(task.id, null);
    toast.success("Task unassigned!");
  };

  const isAssignedToCurrentUser = user && task.assigneeId === user.id;
  const assignedTechnician = technicians.find(tech => tech.id === task.assigneeId);

  return (
    <Card className={`w-full ${task.status === 'completed' ? "opacity-70" : ""} ${task.status === 'cancelled' ? "border-destructive" : ""}`}>
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
            {task.status.replace('-', ' ')}
          </span>
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
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input id="title" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea id="description" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">Location</Label>
                  <Input id="location" value={editedLocation} onChange={(e) => setEditedLocation(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="workOrderNumber" className="text-right">Work Order #</Label>
                  <Input id="workOrderNumber" value={editedWorkOrderNumber} onChange={(e) => setEditedWorkOrderNumber(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dueDate" className="text-right">Due Date</Label>
                  <Input id="dueDate" type="date" value={editedDueDate} onChange={(e) => setEditedDueDate(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="typeOfWork" className="text-right">Type of Work</Label>
                  <Select onValueChange={(value: Task['typeOfWork']) => setEditedTypeOfWork(value)} value={editedTypeOfWork || ""}>
                    <SelectTrigger id="typeOfWork" className="col-span-3">
                      <SelectValue placeholder="Select type of work" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Correction Maintenance">Correction Maintenance</SelectItem>
                      <SelectItem value="Civil Work">Civil Work</SelectItem>
                      <SelectItem value="Overhead Maintenance">Overhead Maintenance</SelectItem>
                      <SelectItem value="Termination Maintenance">Termination Maintenance</SelectItem>
                      <SelectItem value="Replacing Equipment">Replacing Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="equipmentNumber" className="text-right">Equipment #</Label>
                  <Input id="equipmentNumber" value={editedEquipmentNumber} onChange={(e) => setEditedEquipmentNumber(e.target.value)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="assignee" className="text-right">Assignee</Label>
                  <Select onValueChange={(value) => setEditedAssigneeId(value === "unassigned" ? null : value)} value={editedAssigneeId || "unassigned"}>
                    <SelectTrigger id="assignee" className="col-span-3">
                      <SelectValue placeholder="Select a technician" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {loadingTechnicians ? (
                        <SelectItem value="loading" disabled>Loading technicians...</SelectItem>
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
              <Button onClick={handleSaveEdit}>Save changes</Button>
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
                Mark as Unassigned
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('assigned')}>
                Mark as Assigned
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('in-progress')}>
                Mark as In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('cancelled')}>
                Mark as Cancelled
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user && !isAssignedToCurrentUser && (
                <DropdownMenuItem onClick={handleAssignToMe}>
                  Assign to Me
                </DropdownMenuItem>
              )}
              {user && isAssignedToCurrentUser && (
                <DropdownMenuItem onClick={handleUnassign}>
                  Unassign
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
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
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 mr-2" /> Due: {task.dueDate}
          </div>
        )}
        {task.typeOfWork && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Wrench className="h-4 w-4 mr-2" /> Type: {task.typeOfWork}
          </div>
        )}
        {task.equipmentNumber && (
          <div className="flex items-center text-sm text-muted-foreground">
            <HardHat className="h-4 w-4 mr-2" /> Equipment #: {task.equipmentNumber}
          </div>
        )}
        {assignedTechnician && (
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-2" /> Assigned to: {assignedTechnician.first_name} {assignedTechnician.last_name}
          </div>
        )}
        {!task.assigneeId && task.status !== 'unassigned' && (
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-2" /> Unassigned
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCard;