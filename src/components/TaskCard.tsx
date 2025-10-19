"use client";

import React from "react";
import { Task } from "@/types/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, MoreVertical, CalendarIcon, MapPin, Hash } from "lucide-react";
import { useTasks } from "@/context/TaskContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useSession } from "@/context/SessionContext";
import { useProfiles } from "@/hooks/use-profiles"; // Import useProfiles
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { changeTaskStatus, deleteTask, updateTask, assignTask } = useTasks();
  const { user } = useSession();
  const { profiles } = useProfiles(); // Get profiles for assignee names
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(task.title);
  const [editedDescription, setEditedDescription] = React.useState(task.description || "");
  const [editedLocation, setEditedLocation] = React.useState(task.location || "");
  const [editedWorkOrderNumber, setEditedWorkOrderNumber] = React.useState(task.workOrderNumber || "");
  const [editedAssigneeId, setEditedAssigneeId] = React.useState<string | null>(task.assigneeId || null);
  const [editedDueDate, setEditedDueDate] = React.useState<Date | null>(task.dueDate || null);

  const assignedProfile = profiles.find(p => p.id === task.assigneeId);
  const assigneeName = assignedProfile ? `${assignedProfile.first_name || ''} ${assignedProfile.last_name || ''}`.trim() : "Unassigned";

  const handleSaveEdit = () => {
    if (editedTitle.trim() === "") {
      toast.error("Task title cannot be empty.");
      return;
    }
    updateTask(task.id, editedTitle, editedDescription, editedAssigneeId, editedLocation, editedWorkOrderNumber, editedDueDate);
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

  return (
    <Card className={`w-full ${task.status === 'completed' ? "opacity-70" : ""} ${task.status === 'cancelled' ? "border-destructive" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col items-start space-y-1">
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
          {task.assigneeId && (
            <p className="text-sm text-muted-foreground">Assigned to: {assigneeName}</p>
          )}
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
                  <Label htmlFor="assignee" className="text-right">Assignee</Label>
                  <Select onValueChange={setEditedAssigneeId} value={editedAssigneeId || ""} >
                    <SelectTrigger id="assignee" className="col-span-3">
                      <SelectValue placeholder="Select a technician" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.first_name} {profile.last_name} ({profile.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dueDate" className="text-right">Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
                          !editedDueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editedDueDate ? format(editedDueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editedDueDate || undefined}
                        onSelect={setEditedDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
            <CalendarIcon className="h-4 w-4 mr-2" /> Due: {format(task.dueDate, "PPP")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCard;