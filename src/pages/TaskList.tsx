"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTasks } from "@/context/TaskContext";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown, Search, Trash2, User, ListTodo } from "lucide-react";
import { Task } from "@/types/task";
import { isPast, isToday, isTomorrow, addDays } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';
import { useSession } from "@/context/SessionContext";
import { useAssignableUsers } from "@/hooks/use-assignable-users";
import { useProfiles, ProfileWithEmail } from "@/hooks/use-profiles"; // Import ProfileWithEmail
import { useSearchParams } from "react-router-dom"; // Import useSearchParams
import { cn } from "@/lib/utils";
import { TaskListSkeleton } from "@/hooks/use-tasks-query"; // Import TaskListSkeleton
import { toastSuccess, toastError, toastInfo, toastWarning, toastLoading, dismissToast } from '@/utils/toast'; // Import new toast helpers

interface TaskListProps {
  hideForm?: boolean;
}

// Map the old statuses to the new conceptual UI statuses for filtering
type FilterStatus = 'all' | 'pending' | 'in-progress' | 'completed' | 'cancelled';

const TaskList: React.FC<TaskListProps> = ({ hideForm = false }) => {
  const { tasks, changeTaskStatus, deleteTask, assignTask, tasksByIdMap, loading: tasksLoading } = useTasks();
  const { profiles } = useProfiles(); // profiles is now ProfileWithEmail[]
  const { profile: currentUserProfile, user } = useSession();
  const { assignableUsers, loading: loadingUsers } = useAssignableUsers();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams(); // Initialize useSearchParams

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterAssignee, setFilterAssignee] = useState<string | "all">("all");
  const [filterTypeOfWork, setFilterTypeOfWork] = useState<Task['type_of_work'] | "all">("all");
  const [filterReminder, setFilterReminder] = useState<"all" | "overdue" | "due-soon">("all");
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | "all">("all");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set<string>());

  // Effect to read URL parameters and set initial filters
  useEffect(() => {
    const assigneeParam = searchParams.get('filterAssignee');
    if (assigneeParam === 'me' && user?.id) {
      setFilterAssignee(user.id);
    } else if (assigneeParam === 'unassigned') {
      setFilterAssignee('unassigned');
    } else {
      setFilterAssignee('all');
    }
  }, [searchParams, user?.id]);

  const canAddTask = currentUserProfile && ['admin', 'manager', 'supervisor'].includes(currentUserProfile.role);
  const canBulkDelete = currentUserProfile && ['admin', 'manager'].includes(currentUserProfile.role);

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const matchesSearch = searchTerm === "" ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.equipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.task_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.notification_num?.toLowerCase().includes(searchTerm.toLowerCase());

      // Map DB statuses ('unassigned', 'assigned') to UI 'pending' status
      const taskUiStatus: FilterStatus = (task.status === 'unassigned' || task.status === 'assigned') ? 'pending' : task.status;
      const matchesStatus = filterStatus === "all" || taskUiStatus === filterStatus;
      
      // FIX: Correctly handle 'unassigned' filter
      const matchesAssignee = filterAssignee === "all" || 
                              (filterAssignee === "unassigned" && task.assignee_id === null) ||
                              (filterAssignee !== "unassigned" && task.assignee_id === filterAssignee);

      const matchesTypeOfWork = filterTypeOfWork === "all" || task.type_of_work === filterTypeOfWork;
      const matchesPriority = filterPriority === "all" || task.priority === filterPriority;

      const dueDateObj = task.due_date ? new Date(task.due_date) : null;
      const now = new Date();
      const isOverdue = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj) && task.status !== 'completed' && task.status !== 'cancelled';
      const isDueSoon = dueDateObj && (isToday(dueDateObj) || isTomorrow(dueDateObj) || (dueDateObj > now && dueDateObj <= addDays(now, 2))) && task.status !== 'completed' && task.status !== 'cancelled';

      const matchesReminder = filterReminder === "all" ||
        (filterReminder === "overdue" && isOverdue) ||
        (filterReminder === "due-soon" && isDueSoon && !isOverdue);

      return matchesSearch && matchesStatus && matchesAssignee && matchesTypeOfWork && matchesReminder && matchesPriority;
    });

    const currentUserId = user?.id;
    const isInactive = (status: Task['status']) => status === 'completed' || status === 'cancelled';

    return filtered.sort((a, b) => {
      // Optimistic tasks always float to the top
      if ((a as any)._optimistic && !(b as any)._optimistic) return -1;
      if (!(a as any)._optimistic && (b as any)._optimistic) return 1;

      const aIsInactive = isInactive(a.status);
      const bIsInactive = isInactive(b.status);

      // Group active tasks before inactive tasks
      if (!aIsInactive && bIsInactive) return -1;
      if (aIsInactive && !bIsInactive) return 1;

      // Within groups, prioritize tasks assigned to the current user
      const aIsAssignedToMe = a.assignee_id === currentUserId;
      const bIsAssignedToMe = b.assignee_id === currentUserId;

      if (aIsAssignedToMe && !bIsAssignedToMe) return -1;
      if (!aIsAssignedToMe && bIsAssignedToMe) return 1;

      // Finally, sort by creation date descending (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tasks, searchTerm, filterStatus, filterAssignee, filterTypeOfWork, filterReminder, filterPriority, user]);

  const handleSelectTask = useCallback((taskId: string, isSelected: boolean) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllTasks = useCallback((isSelected: boolean) => {
    if (isSelected) {
      const allVisibleTaskIds = filteredTasks.map(task => task.id);
      setSelectedTaskIds(new Set(allVisibleTaskIds));
    } else {
      setSelectedTaskIds(new Set());
    }
  }, [filteredTasks]);

  const handleBulkAction = useCallback(async (action: string, value?: string | null) => {
    if (selectedTaskIds.size === 0) {
      toastError(t('no_tasks_selected_for_bulk_action'));
      return;
    }

    const isAdminOrManager = currentUserProfile && ['admin', 'manager'].includes(currentUserProfile.role);
    let tasksToActOn = Array.from(selectedTaskIds);
    const originalCount = tasksToActOn.length;

    if (!isAdminOrManager) {
      tasksToActOn = tasksToActOn.filter(taskId => {
        const task = tasksByIdMap.get(taskId);
        return task && task.status !== 'completed';
      });

      const filteredCount = tasksToActOn.length;
      if (originalCount > filteredCount) {
        toastWarning(t('skipped_completed_tasks_warning', { count: originalCount - filteredCount }));
      }
    }
    
    if (tasksToActOn.length === 0) {
        toastInfo(t('no_eligible_tasks_for_action'));
        setSelectedTaskIds(new Set());
        return;
    }

    const loadingToastId = toastLoading(t('performing_bulk_action'));

    try {
      switch (action) {
        case 'status':
          if (value) {
            let successCount = 0;
            for (const taskId of tasksToActOn) {
              // When bulk changing status, we must use the actual DB status values
              const dbStatus = value as Task['status'];
              const success = await changeTaskStatus(taskId, dbStatus);
              if (success) {
                successCount++;
              }
            }
            if (successCount > 0) {
              toastSuccess(t('status_updated_for_tasks', { count: successCount }));
            }
            const failCount = tasksToActOn.length - successCount;
            if (failCount > 0) {
              toastWarning(t('tasks_could_not_be_updated_warning', { count: failCount }));
            }
          }
          break;
        case 'assign':
          const assignableTasks = tasksToActOn.filter(taskId => {
              const task = tasksByIdMap.get(taskId);
              if (!task) return false;

              const isCurrentlyAssigned = !!task.assignee_id;
              const isDueDatePassed = task.due_date ? isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) : false;
              const isPrivilegedReassigner = currentUserProfile && ['admin', 'manager', 'supervisor'].includes(currentUserProfile.role);

              if (currentUserProfile?.role === 'admin') return true;
              if (!isCurrentlyAssigned) return true;
              if (isDueDatePassed && isPrivilegedReassigner) return true;
              
              return false;
          });

          if (tasksToActOn.length > assignableTasks.length) {
              const skippedCount = tasksToActOn.length - assignableTasks.length;
              toastWarning(t('skipped_ineligible_for_reassignment', { count: skippedCount }));
          }

          if (assignableTasks.length === 0) {
              toastInfo(t('no_eligible_tasks_for_assignment'));
              break;
          }

          let assignSuccessCount = 0;
          for (const taskId of assignableTasks) {
            // When assigning, the TaskContext handles setting the status to 'assigned' or 'unassigned' if applicable.
            const success = await assignTask(taskId, value === undefined ? null : value);
            if (success) {
              assignSuccessCount++;
            }
          }
          if (assignSuccessCount > 0) {
            toastSuccess(t('assignee_updated_for_tasks', { count: assignSuccessCount }));
          }
          const assignFailCount = assignableTasks.length - assignSuccessCount;
          if (assignFailCount > 0) {
            toastWarning(t('tasks_could_not_be_assigned_warning', { count: assignFailCount }));
          }
          break;
        case 'delete':
          for (const taskId of tasksToActOn) {
            await deleteTask(taskId);
          }
          toastSuccess(t('tasks_deleted', { count: tasksToActOn.length }));
          break;
        default:
          break;
      }
    } catch (error: any) {
      toastError(error);
    } finally {
      setSelectedTaskIds(new Set());
      dismissToast(loadingToastId);
    }
  }, [selectedTaskIds, currentUserProfile, tasksByIdMap, t, changeTaskStatus, assignTask, deleteTask]);

  const allTasksSelected = filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length;

  return (
    <div className="space-y-6">
      {!hideForm && canAddTask && <TaskForm />}

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('search_tasks')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Status Filter: Maps unassigned/assigned to pending */}
        <Select onValueChange={(value: FilterStatus) => setFilterStatus(value)} value={filterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('filter_by_status')} />
          </SelectTrigger>
          <SelectContent className="min-w-[var(--radix-select-trigger-width)]" align="end">
            <SelectItem value="all">{t('all_statuses')}</SelectItem>
            <SelectItem value="pending">{t('pending')}</SelectItem>
            <SelectItem value="in-progress">{t('in_progress').replace('-', ' ')}</SelectItem>
            <SelectItem value="completed">{t('completed')}</SelectItem>
            <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value: string | "all") => setFilterAssignee(value)} value={filterAssignee}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('filter_by_assignee')} />
          </SelectTrigger>
          <SelectContent className="min-w-[var(--radix-select-trigger-width)]" align="end">
            <SelectItem value="all">{t('all_assignees')}</SelectItem>
            <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
            {(profiles as ProfileWithEmail[]).map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.first_name} {profile.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(value: Task['type_of_work'] | "all") => setFilterTypeOfWork(value)} value={filterTypeOfWork}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('filter_by_type_of_work')} />
          </SelectTrigger>
          <SelectContent className="min-w-[var(--radix-select-trigger-width)]" align="end">
            <SelectItem value="all">{t('all_types')}</SelectItem>
            <SelectItem value="Correction Maintenance">{t('correction_maintenance')}</SelectItem>
            <SelectItem value="Civil Work">{t('civil_work')}</SelectItem>
            <SelectItem value="Overhead Maintenance">{t('overhead_maintenance')}</SelectItem>
            <SelectItem value="Termination Maintenance">{t('termination_maintenance')}</SelectItem>
            <SelectItem value="Replacing Equipment">{t('replacing_equipment')}</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value: "all" | "overdue" | "due-soon") => setFilterReminder(value)} value={filterReminder}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('filter_by_reminder')} />
          </SelectTrigger>
          <SelectContent className="min-w-[var(--radix-select-trigger-width)]" align="end">
            <SelectItem value="all">{t('all_tasks')}</SelectItem>
            <SelectItem value="overdue">{t('overdue')}</SelectItem>
            <SelectItem value="due-soon">{t('due_soon')}</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value: Task['priority'] | "all") => setFilterPriority(value)} value={filterPriority}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('filter_by_priority')} />
          </SelectTrigger>
          <SelectContent className="min-w-[var(--radix-select-trigger-width)]" align="end">
            <SelectItem value="low">{t('low')}</SelectItem>
            <SelectItem value="medium">{t('medium')}</SelectItem>
            <SelectItem value="high">{t('high')}</SelectItem>
            <SelectItem value="urgent">{t('urgent')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTasks.length > 0 && (
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={allTasksSelected}
              onCheckedChange={(checked) => handleSelectAllTasks(checked === true)}
              id="select-all-tasks"
              className="h-5 w-5"
            />
            <Label htmlFor="select-all-tasks" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t('select_all')} ({selectedTaskIds.size} {t('selected')})
            </Label>
          </div>

          {selectedTaskIds.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {t('bulk_actions')} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {/* Bulk status actions use the actual DB status values */}
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'unassigned')}>
                  <ListTodo className="mr-2 h-4 w-4" /> {t('mark_as_pending')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'in-progress')}>
                  <ListTodo className="mr-2 h-4 w-4" /> {t('mark_as_in_progress').replace('-', ' ')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'completed')}>
                  <ListTodo className="mr-2 h-4 w-4" /> {t('mark_as_completed')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('status', 'cancelled')}>
                  <ListTodo className="mr-2 h-4 w-4" /> {t('mark_as_cancelled')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkAction('assign', null)}>
                  <User className="mr-2 h-4 w-4" /> {t('unassign')}
                </DropdownMenuItem>
                {currentUserProfile && ['supervisor', 'technician'].includes(currentUserProfile.role) && (
                  <DropdownMenuItem onClick={() => handleBulkAction('assign', currentUserProfile.id)}>
                    <User className="mr-2 h-4 w-4" /> {t('assign_to_me')}
                  </DropdownMenuItem>
                )}
                {loadingUsers ? (
                  <DropdownMenuItem disabled>{t('loading_users')}...</DropdownMenuItem>
                ) : (
                  assignableUsers.map((user) => (
                    <DropdownMenuItem key={user.id} onClick={() => handleBulkAction('assign', user.id)}>
                      <User className="mr-2 h-4 w-4" /> {user.first_name} {user.last_name}
                    </DropdownMenuItem>
                  ))
                )}
                {canBulkDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> {t('delete_selected')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {tasksLoading ? (
          <TaskListSkeleton />
        ) : filteredTasks.length === 0 ? (
          <p className="text-center text-muted-foreground">{t('no_tasks_found_matching_criteria')}</p>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              taskId={task.id}
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