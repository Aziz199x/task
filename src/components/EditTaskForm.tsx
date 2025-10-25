"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useTasks } from "@/context/TaskContext";
import { useSession } from "@/context/SessionContext";
import { useAssignableUsers } from "@/hooks/use-assignable-users";
import { Task } from "@/types/task";
import { useTranslation } from 'react-i18next';
import PhotoUploader from "./PhotoUploader";
import { isPast, isToday } from 'date-fns';
import { DatePicker } from "./DatePicker"; // Import the new DatePicker

interface EditTaskFormProps {
  task: Task; // Initial task data, will be updated from context
  onClose: () => void;
  canEditOrDelete: boolean;
  canComplete: boolean;
}

// Regex to validate Google Maps URL formats:
// 1. https://www.google.com/maps?q=LATITUDE,LONGITUDE
// 2. https://maps.app.goo.gl/SHORTCODE
const googleMapsUrlRegex = /^(https:\/\/www\.google\.com\/maps\?q=(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)|https:\/\/maps\.app\.goo\.gl\/[a-zA-Z0-9]+)$/;

const EditTaskForm: React.FC<EditTaskFormProps> = ({ task: initialTask, onClose, canEditOrDelete, canComplete }) => {
  const { tasksByIdMap, updateTask, deleteTaskPhoto } = useTasks();
  const { profile: currentUserProfile } = useSession();
  const { assignableUsers, loading: loadingUsers } = useAssignableUsers();
  const { t } = useTranslation();

  // Get the current task from global state (real-time updates)
  const currentTask = tasksByIdMap.get(initialTask.id) || initialTask;
  
  const [editedTask, setEditedTask] = useState<Partial<Task>>(() => currentTask);
  const [dueDateObject, setDueDateObject] = useState<Date | undefined>(
    currentTask.due_date ? new Date(currentTask.due_date) : undefined
  );
  const [isSaving, setIsSaving] = useState(false);
  const [notificationNumError, setNotificationNumError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Sync local state with global state when task updates
  useEffect(() => {
    setEditedTask(currentTask);
    setDueDateObject(currentTask.due_date ? new Date(currentTask.due_date) : undefined);
  }, [currentTask]);

  const validateLocationUrl = (url: string | null | undefined): string | null => {
    if (!url || url.trim() === "") return null;
    if (!googleMapsUrlRegex.test(url)) return t('location_url_invalid_format');
    return null;
  };

  const validateNotificationNum = (num: string | null | undefined): string | null => {
    if (!num || num.trim() === "") return null;
    if (!/^\d+$/.test(num) || num.length !== 10 || !num.startsWith('41')) return t('notification_num_invalid_format');
    return null;
  };

  const handleNotificationNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditedTask(prev => ({...prev, notification_num: value}));
    setNotificationNumError(validateNotificationNum(value));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditedTask(prev => ({...prev, location: value}));
    setLocationError(validateLocationUrl(value));
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

    const locError = validateLocationUrl(editedTask.location);
    if (locError) {
      setLocationError(locError);
      toast.error(locError);
      setIsSaving(false);
      return;
    }

    // Convert Date object to ISO string date part (YYYY-MM-DD) for Supabase
    const dueDateString = dueDateObject ? dueDateObject.toISOString().split('T')[0] : null;

    const updatesToSend: Partial<Task> = {
        ...editedTask,
        due_date: dueDateString,
    };

    // Note: The DatePicker already prevents past dates, so we remove the redundant date validation here.

    const success = await updateTask(currentTask.id, updatesToSend);
    setIsSaving(false);

    if (success) {
      toast.success(t('task_updated_successfully'));
      onClose();
    }
  };

  const handlePhotoUploadSuccess = useCallback(async (photoType: 'before' | 'after' | 'permit', url: string) => {
    const photoUrlKey = `photo_${photoType}_url` as keyof Task;
    
    // Update the database immediately - this will trigger real-time updates
    await updateTask(currentTask.id, { [photoUrlKey]: url });
    toast.success(t('photo_uploaded_successfully'));
  }, [currentTask.id, updateTask, t]);

  const handlePhotoRemove = useCallback(async (photoType: 'before' | 'after' | 'permit') => {
    const photoUrlKey = `photo_${photoType}_url` as keyof Task;
    const currentUrl = currentTask[photoUrlKey] as string | null | undefined;
    
    // Delete from storage first
    if (currentUrl) {
      await deleteTaskPhoto(currentUrl);
    }
    
    // Update the database - this will trigger real-time updates
    await updateTask(currentTask.id, { [photoUrlKey]: null });
    toast.success(t('photo_removed_successfully'));
  }, [currentTask.id, deleteTaskPhoto, updateTask, t, currentTask]);

  return (
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
        <Input
          id="location"
          value={editedTask.location || ''}
          onChange={handleLocationChange}
          placeholder={t('location_placeholder')}
          className="col-span-3"
          disabled={!canEditOrDelete}
        />
        {locationError && <p className="col-span-4 text-right text-destructive text-sm">{locationError}</p>}
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
        <div className="col-span-3">
          <DatePicker 
            date={dueDateObject} 
            setDate={setDueDateObject} 
            disabled={!canEditOrDelete} 
            placeholder={t('pick_a_date')}
          />
        </div>
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
          disabled={!(canEditOrDelete || canComplete)}
        />
        {notificationNumError && <p className="col-span-4 text-right text-destructive text-sm">{notificationNumError}</p>}
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="priority" className="text-right">{t('priority')}</Label>
        <Select onValueChange={(value: Task['priority']) => setEditedTask({...editedTask, priority: value})} value={editedTask.priority || "medium"} disabled={!canEditOrDelete}>
          <SelectTrigger id="priority" className="col-span-3">
            <SelectValue placeholder={t('select_priority')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">{t('low')}</SelectItem>
            <SelectItem value="medium">{t('medium')}</SelectItem>
            <SelectItem value="high">{t('high')}</SelectItem>
            <SelectItem value="urgent">{t('urgent')}</SelectItem>
          </SelectContent>
        </Select>
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
      {canComplete && (
        <>
          <PhotoUploader
            label={t('before_work_photo')}
            taskId={currentTask.id}
            photoType="before"
            currentUrl={currentTask.photo_before_url}
            onUploadSuccess={(url) => handlePhotoUploadSuccess('before', url)}
            onRemove={() => handlePhotoRemove('before')}
          />
          <PhotoUploader
            label={t('after_work_photo')}
            taskId={currentTask.id}
            photoType="after"
            currentUrl={currentTask.photo_after_url}
            onUploadSuccess={(url) => handlePhotoUploadSuccess('after', url)}
            onRemove={() => handlePhotoRemove('after')}
          />
          <PhotoUploader
            label={t('permit_photo')}
            taskId={currentTask.id}
            photoType="permit"
            currentUrl={currentTask.photo_permit_url}
            onUploadSuccess={(url) => handlePhotoUploadSuccess('permit', url)}
            onRemove={() => handlePhotoRemove('permit')}
          />
        </>
      )}
      <Button onClick={handleSaveEdit} disabled={isSaving || !!notificationNumError || !!locationError}>{t('save_changes')}</Button>
    </div>
  );
};

export default EditTaskForm;