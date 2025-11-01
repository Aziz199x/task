"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTasks } from '@/context/TaskContext';
import { Task } from '@/types/task';
import { useProfiles, ProfileWithEmail } from '@/hooks/use-profiles'; // To resolve assignee names, import ProfileWithEmail

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
          } else if (field === 'priorityText<dyad-problem-report summary="2 problems">
<problem file="src/components/ChatImportButton.tsx" line="85" column="36" code="2339">Property 'typeOfWork' does not exist on type 'Task'.</problem>
<problem file="src/components/ui/sidebar.tsx" line="122" column="9" code="2322">Type '{ isMobile: boolean; isClientLoaded: boolean; }' is not assignable to type 'boolean'.</problem>
</dyad-problem-report><think>**Debugging TypeScript Issues**

I'm currently focused on resolving the TypeScript errors flagged in `ChatImportButton.tsx`. Specifically, I'm working on the `Task` type and ensuring that the `typeOfWork` property is correctly defined and accessible within the component. Initial investigation suggests a potential discrepancy between the expected and actual structure of the `Task` object. I'm exploring the type definition to pinpoint the root cause of this "does not exist" error.


**Pinpointing the Root Cause**

I've homed in on the core of the TypeScript issues. It's a simple casing mismatch in `ChatImportButton.tsx` –  `typeOfWork` should be `type_of_work`. Unfortunately, I still don't have the context for `sidebar.tsx`, so the second error remains unresolved. I'll need the contents of that file to provide a solution for that issue, as it is excluded from context.


**Resolving Casing Mismatch**

I've confirmed that the issue in `ChatImportButton.tsx` stems from a simple typo. The component incorrectly references `typeOfWork` when it should reference `type_of_work`. I will fix this. Regarding the `sidebar.tsx` error, I still can't address it directly without access to the file's content. Based on the error message, it looks like a component is expecting a boolean value, but is receiving an object. I would need to modify how the `isMobile` prop is passed or how the component uses that prop, but I can only describe the likely fix.


**Identifying Necessary Changes**

I've re-examined the error in `ChatImportButton.tsx`.  The issue is indeed a casing mismatch: the code references `typeOfWork` instead of the correct `type_of_work`. This is now the priority. I still can't address the `sidebar.tsx` error directly because that file's content is excluded from context. Based on the error, I would describe a potential fix if I had that context.


</think>You're right, let's get these last two TypeScript errors sorted out!

### 1. Fixing `src/components/ChatImportButton.tsx`

The error `Property 'typeOfWork' does not exist on type 'Task'` is a casing issue. The `Task` type defines `type_of_work` (snake\_case), but the code was trying to use `typeOfWork` (camelCase). I'll correct this to match the type definition.

<dyad-write path="src/components/ChatImportButton.tsx" description="Correcting the casing of 'type_of_work' to match the Task type definition.">
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTasks } from '@/context/TaskContext';
import { Task } from '@/types/task';
import { useProfiles, ProfileWithEmail } from '@/hooks/use-profiles'; // To resolve assignee names, import ProfileWithEmail

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
      toast.error(t('please_paste_chat_text'));
      return;
    }

    setLoading(true);
    try {
      const parsedTasks = parseChatText(chatText);

      const validTasks = parsedTasks.filter(task => task.title && task.equipment_number);
      const invalidTaskCount = parsedTasks.length - validTasks.length;

      if (validTasks.length === 0) {
        toast.error(t('no_valid_tasks_found_in_chat'));
        setLoading(false);
        return;
      }

      await addTasksBulk(validTasks as Task[]);
      toast.success(t('chat_import_success', { count: validTasks.length }));
      if (invalidTaskCount > 0) {
        toast.warning(t('chat_import_invalid_tasks_skipped', { count: invalidTaskCount }));
      }
      setIsOpen(false);
      setChatText('');
    } catch (error: any) {
      console.error("Error importing tasks from chat:", error);
      toast.error(`${t('error_importing_tasks_from_chat')}: ${error.message}`);
    } finally {
      setLoading(false);
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