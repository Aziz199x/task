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
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface TaskListProps {
  hideForm?: boolean; // New prop
}

const TaskList: React.FC<TaskListProps> = ({ hideForm = false }) => {
  const { tasks, changeTaskStatus, deleteTask, assignTask } = useTasks();
  const { technicians, loading: loadingTechnicians } = useTechnicians();
  const { t } = useTranslation(); // Initialize useTranslation

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
      toast.error(t('no_tasks_selected_for_bulk_action'));
      return;
    }

    const tasksToActOn = tasks.filter(task => selectedTaskIds.has(task.id));

    switch (action) {
      case 'status':
        if (value) {
          tasksToActOn.forEach(task => changeTaskStatus(task.id, value as Task['status']));
          toast.success(t('status_updated_for_tasks', { count: selectedTaskIds.size }));
        }
        break;
      case 'assign':
        tasksToActOn.forEach(task => assignTask(task.id, value));
        toast.success(t('assignee_updated_for_tasks', { count: selectedTaskIds.size }));
        break;
      case 'delete':
        tasksToActOn.forEach(task => deleteTask(task.id));
        toast.success(t('tasks_deleted', { count: selectedTaskIds.size }));
        break;
      default:
        break;
    }
    setSelectedTaskIds(new Set());
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
      {!hideForm && <TaskForm />} {/* Conditionally render TaskForm */}

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search_tasks')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select onValueChange={(value: Task['status'] | "all") => setFilterStatus(value)} value={filterStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t('filter_by_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_statuses')}</SelectItem>
            <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
            <SelectItem value="assigned">{t('assigned')}</SelectItem>
            <SelectItem value="in-progress">{t('in_progress')}</SelectItem>
            <SelectItem value="completed">{t('completed')}</SelectItem>
            <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value: string | "all") => setFilterAssignee(value)} value={filterAssignee}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t('filter_by_assignee')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_assignees')}</SelectItem>
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

        <Select onValueChange={(value: Task['typeOfWork'] | "all") => setFilterTypeOfWork(value)} value={filterTypeOfWork}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder={t('filter_by_type_of_work')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_types')}</SelectItem>
            <SelectItem value="Correction Maintenance">{t('correction_maintenance')}</SelectItem>
            <SelectItem value="Civil Work">{t('civil_work')}</SelectItem>
            <SelectItem value="Overhead Maintenance">{t('overhead_maintenance')}</SelectItem>
            <SelectItem value="Termination Maintenance">{t('termination_maintenance')}</SelectItem>
            <SelectItem value="Replacing Equipment">{t('replacing_equipment')}</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value: "all" | "overdue" | "due-soon") => setFilterReminder(value)} value={filterReminder}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t('filter_by_reminder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_tasks')}</SelectItem>
            <SelectItem value="overdue">{t('overdue')}</SelectItem>
            <SelectItem value="due-soon">{t('due_soon')}</SelectItem>
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
            {t('select_all')} ({selectedTaskIds.size} {t('selected')})
          </Label>

          {selectedTaskIds.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {t('bulk_actions')} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'unassigned')}>
                  <ListTodo className="mr-2 h-4 w-4" /> {t('mark_as_unassigned')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'assigned')}>
                  <ListTodo className="mr-2 h-4 w-4" /> {t('mark_as_assigned')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'in-progress')}>
                  <ListTodo className="mr-2 h-4 w-4" /> {t('mark_as_in_progress')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'completed')}>
                  <ListTodo className="mr-2 h-4 w-4" /> {t('mark_as_completed')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'cancelled')}>
                  <ListTodo className="mr-2 h-4 w-4" /> {t('mark_as_cancelled')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <User className="mr-2 h-4 w-4" /> {t('assign_to')}
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem onClick={() => handleBulkAction('assign', null)}>
                    {t('unassign')}
                  </DropdownMenuItem>
                  {loadingTechnicians ? (
                    <DropdownMenuItem disabled>{t('loading_technicians')}...</DropdownMenuItem>
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
                  <Trash2 className="mr-2 h-4 w-4" /> {t('delete_selected')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <p className="text-center text-muted-foreground">{t('no_tasks_found_matching_criteria')}</p>
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