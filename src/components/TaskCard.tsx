"use client";

import React from "react";
import { Task } from "@/types/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, MoreVertical } from "lucide-react";
import { useTasks } from "@/context/TaskContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useSession } from "@/context/SessionContext";

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { changeTaskStatus, deleteTask, updateTask, assignTask } = useTasks();
  const { user } = useSession();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(task.title);
  const [editedDescription, setEditedDescription] = React.useState(task.description || "");

  const handleSaveEdit = () => {
    if (editedTitle.trim() === "") {
      toast.error("Task title cannot be empty.");
      return;
    }
    updateTask(task.id, editedTitle, editedDescription, task.assigneeId);
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
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="col-span-3"
                  />
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
      {task.description && (
        <CardContent>
          <p className={`text-sm text-muted-foreground ${task.status === 'completed' ? "line-through" : ""}`}>
            {task.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default TaskCard;