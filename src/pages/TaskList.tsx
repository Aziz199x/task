"use client";

import React, { useState, useMemo } from "react";
import { useTasks } from "@/context/TaskContext";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown, Filter, Search, Trash2, User, BellRing } from "lucide-react";
import { useTechnicians } from "@/hooks/use-technicians";
import { Task } from "@/types/task";
import { isPast, isToday, isTomorrow, addDays } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";

const TaskList: React.FC = () => {
  const { tasks, changeTaskStatus, deleteTask, assignTask } = useTasks();
  const { technicians, loading: loadingTechnicians } = useTechnicians();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<Task['status'] | "all">("all");
  const [filterAssignee, setFilterAssignee] = useState<string | "all">("all");
  const [filterTypeOfWork, setFilterTypeOfWork] = useState<Task['typeOfWork'] | "all">("all");
  const [filterReminder, setFilterReminder] = useState<"all" | "overdue" | "due-soon">("all");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  const handleSelectTask = (taskId: string, isSelected: boolean) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAllTasks = (isSelected: boolean) => {
    if (isSelected) {
      const allVisibleTaskIds = filteredTasks.map(task => task.id);
      setSelectedTaskIds(new Set(allVisibleTaskIds));
    } else {
      setSelectedTaskIds(new Set());
    }
  };

  const handleBulkAction = (action: string, value?: string | null) => {
    if (selectedTaskIds.size === 0) {
      toast.error("No tasks selected for bulk action.");
      return;
    }

    const tasksToActOn = tasks.filter(task => selectedTaskIds.has(task.id));

    switch (action) {
      case 'status':
        if (value) {
          tasksToActOn.forEach(task => changeTaskStatus(task.id, value as Task['status']));
          toast.success(`Status updated for ${selectedTaskIds.size} tasks.`);
        }
        break;
      case 'assign':
        tasksToActOn.forEach(task => assignTask(task.id, value));
        toast.success(`Assignee updated for ${selectedTaskIds.size} tasks.`);
        break;
      case 'delete':
        tasksToActOn.forEach(task => deleteTask(task.id));
        toast.success(`${selectedTaskIds.size} tasks deleted.`);
        break;
      default:
        break;
    }
    setSelectedTaskIds(new Set()); // Clear selection after action
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = searchTerm === "" ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.equipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.workOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || task.status === filterStatus;
      const matchesAssignee = filterAssignee === "all" || task.assigneeId === filterAssignee;
      const matchesTypeOfWork = filterTypeOfWork === "all" || task.typeOfWork === filterTypeOfWork;

      const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
      const now = new Date();
      const isOverdue = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj) && task.status !== 'completed' && task.status !== 'cancelled';
      const isDueSoon = dueDateObj && (isToday(dueDateObj) || isTomorrow(dueDateObj) || (dueDateObj > now && dueDateObj <= addDays(now, 2))) && task.status !== 'completed' && task.status !== 'cancelled';

      const matchesReminder = filterReminder === "all" ||
        (filterReminder === "overdue" && isOverdue) ||
        (filterReminder === "due-soon" && isDueSoon && !isOverdue);

      return matchesSearch && matchesStatus && matchesAssignee && matchesTypeOfWork && matchesReminder;
    });
  }, [tasks, searchTerm, filterStatus, filterAssignee, filterTypeOfWork, filterReminder]);

  const allTasksSelected = filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length;

  return (
    <div className="space-y-8">
      <TaskForm />

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select onValueChange={(value: Task['status'] | "all") => setFilterStatus(value)} value={filterStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value: string | "all") => setFilterAssignee(value)} value={filterAssignee}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
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

        <Select onValueChange={(value: Task['typeOfWork'] | "all") => setFilterTypeOfWork(value)} value={filterTypeOfWork}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by Type of Work" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Correction Maintenance">Correction Maintenance</SelectItem>
            <SelectItem value="Civil Work">Civil Work</SelectItem>
            <SelectItem value="Overhead Maintenance">Overhead Maintenance</SelectItem>
            <SelectItem value="Termination Maintenance">Termination Maintenance</SelectItem>
            <SelectItem value="Replacing Equipment">Replacing Equipment</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value: "all" | "overdue" | "due-soon") => setFilterReminder(value)} value={filterReminder}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Reminder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="due-soon">Due Soon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTasks.length > 0 && (
        <div className="flex items-center gap-4 mb-4">
          <Checkbox
            checked={allTasksSelected}
            onCheckedChange={(checked) => handleSelectAllTasks(checked === true)}
            id="select-all-tasks"
          />
          <Label htmlFor="select-all-tasks" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Select All ({selectedTaskIds.size} selected)
          </Label>

          {selectedTaskIds.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'unassigned')}>
                  <ListTodo className="mr-2 h-4 w-4" /> Mark as Unassigned
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'assigned')}>
                  <ListTodo className="mr-2 h-4 w-4" /> Mark as Assigned
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'in-progress')}>
                  <ListTodo className="mr-2 h-4 w-4" /> Mark as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'completed')}>
                  <ListTodo className="mr-2 h-4 w-4" /> Mark as Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'cancelled')}>
                  <ListTodo className="mr-2 h-4 w-4" /> Mark as Cancelled
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}> {/* Prevent closing */}
                    <User className="mr-2 h-4 w-4" /> Assign To
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem onClick={() => handleBulkAction('assign', null)}>
                    Unassign
                  </DropdownMenuItem>
                  {loadingTechnicians ? (
                    <DropdownMenuItem disabled>Loading technicians...</DropdownMenuItem>
                  ) : (
                    technicians.map((tech) => (
                      <DropdownMenuItem key={tech.id} onClick={() => handleBulkAction('assign', tech.id)}>
                        {tech.first_name} {tech.last_name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <p className="text-center text-muted-foreground">No tasks found matching your criteria.</p>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onSelect={handleSelectTask}
              isSelected={selectedTaskIds.has(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;