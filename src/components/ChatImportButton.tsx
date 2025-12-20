"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquareText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTasks } from '@/context/TaskContext';
import { Task } from '@/types/task';
import { useProfiles, ProfileWithEmail } from '@/hooks/use-profiles'; // To resolve assignee names, import ProfileWithEmail
import { toastSuccess, toastError, toastWarning, toastLoading, dismissToast } from '@/utils/toast'; // Import new toast helpers

const ChatImportButton: React.FC = () => {
  const { t } = useTranslation();
  const { addTasksBulk } = useTasks();
  const { profiles } = useProfiles(); // profiles is now ProfileWithEmail[]
  const [isOpen, setIsOpen] = useState(false);
  const [chatText, setChatText] = useState('');
  const [loading, setLoading] = useState(false);

  const parseChatText = (text: string): Partial<Task>[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const tasks: Partial<Task>[] = [];
    let currentTask: Partial<Task> = {};

    const keywords: { [key: string]: keyof Task | 'assigneeName' | 'priorityText' | 'typeOfWorkText' | 'statusText' } = {
      'Task:': 'title',
      'Title:': 'title',
      'Description:': 'description',
      'Assignee:': 'assigneeName', // Custom key for name resolution
      'Due Date:': 'due_date',
      'Location:': 'location',
      'Equipment Number:': 'equipment_number',
      'Notification Num:': 'notification_num',
      'Priority:': 'priorityText', // Custom key for text mapping
      'Type of Work:': 'typeOfWorkText', // Custom key for text mapping
      'Status:': 'statusText', // Custom key for text mapping
    };

    const resetCurrentTask = () => {
      if (Object.keys(currentTask).length > 0 && currentTask.title && currentTask.equipment_number) {
        tasks.push(currentTask);
      }
      currentTask = {};
    };

    for (const line of lines) {
      let matched = false;
      for (const keyword in keywords) {
        if (line.startsWith(keyword)) {
          const value = line.substring(keyword.length).trim();
          const field = keywords[keyword];

          if (field === 'title') {
            // If a new title is found, push the previous task if it's valid
            resetCurrentTask();
            currentTask.title = value;
          } else if (field === 'assigneeName') {
            // Attempt to find assignee ID by name
            const matchedProfile = (profiles as ProfileWithEmail[]).find(p => 
              `${p.first_name} ${p.last_name}`.toLowerCase() === value.toLowerCase() ||
              p.first_name?.toLowerCase() === value.toLowerCase() ||
              p.last_name?.toLowerCase() === value.toLowerCase()
            );
            currentTask.assignee_id = matchedProfile?.id || null;
          } else if (field === 'due_date') {
            // Basic date parsing, assumes YYYY-MM-DD or similar
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                currentTask.due_date = date.toISOString().split('T')[0];
              }
            } catch (e) {
              console.warn(`Could not parse due date: ${value}`);
            }
          } else if (field === 'priorityText') {
            const lowerValue = value.toLowerCase();
            if (['low', 'medium', 'high', 'urgent'].includes(lowerValue)) {
              currentTask.priority = lowerValue as Task['priority'];
            }
          } else if (field === 'typeOfWorkText') {
            const normalizedValue = value.replace(/\s/g, ' ').trim(); // Normalize spaces
            const validTypes: Task['type_of_work'][] = ['Correction Maintenance', 'Civil Work', 'Overhead Maintenance', 'Termination Maintenance', 'Replacing Equipment'];
            const matchedType = validTypes.find(type => type.toLowerCase() === normalizedValue.toLowerCase());
            currentTask.type_of_work = matchedType || null;
          } else if (field === 'statusText') {
            const lowerValue = value.toLowerCase();
            if (['unassigned', 'assigned', 'in-progress', 'completed', 'cancelled'].includes(lowerValue)) {
              currentTask.status = lowerValue as Task['status'];
            }
          }
          else {
            (currentTask as any)[field] = value;
          }
          matched = true;
          break;
        }
      }
      // If no keyword matched, and we have a current task, append to description
      if (!matched && currentTask.title) {
        currentTask.description = (currentTask.description ? currentTask.description + '\n' : '') + line;
      }
    }
    resetCurrentTask(); // Push the last task

    return tasks;
  };

  const handleImport = async () => {
    if (!chatText.trim()) {
      toastError(t('please_paste_chat_text'));
      return;
    }

    setLoading(true);
    const loadingToastId = toastLoading(t('processing_chat_text'));
    try {
      const parsedTasks = parseChatText(chatText);

      const validTasks = parsedTasks.filter(task => task.title && task.equipment_number);
      const invalidTaskCount = parsedTasks.length - validTasks.length;

      if (validTasks.length === 0) {
        toastError(t('no_valid_tasks_found_in_chat'));
        setLoading(false);
        dismissToast(loadingToastId);
        return;
      }

      await addTasksBulk(validTasks as Task[]);
      toastSuccess(t('chat_import_success', { count: validTasks.length }));
      if (invalidTaskCount > 0) {
        toastWarning(t('chat_import_invalid_tasks_skipped', { count: invalidTaskCount }));
      }
      setIsOpen(false);
      setChatText('');
    } catch (error: any) {
      console.error("Error importing tasks from chat:", error);
      toastError(t('error_importing_tasks_from_chat', { message: error.message }));
    } finally {
      setLoading(false);
      dismissToast(loadingToastId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageSquareText className="h-4 w-4 mr-2" /> {t('import_from_chat')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('import_tasks_from_chat')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            {t('chat_import_instructions')}
          </p>
          <div className="space-y-2">
            <Label htmlFor="chat-text">{t('paste_chat_text_here')}</Label>
            <Textarea
              id="chat-text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder={t('chat_text_placeholder')}
              rows={10}
            />
          </div>
        </div>
        <Button onClick={handleImport} disabled={loading || !chatText.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <MessageSquareText className="h-4 w-4 mr-2" />
          )}
          {loading ? t('processing') : t('import_tasks')}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ChatImportButton;