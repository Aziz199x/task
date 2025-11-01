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
import MultiPhotoUploader from "./MultiPhotoUploader";
import { isPast, isToday } from 'date-fns';
import { DatePicker } from "./DatePicker";

interface EditTaskFormProps {
  task: Task;
  onClose: () => void;
  canEditOrDelete: boolean;
  canComplete: boolean;
}

const googleMapsUrlRegex = /^(https:\/\/www\.google\.com\/maps\?q=(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)|https:\/\/maps\.app\.goo\.gl\/[a-zA-Z0-9]+)$/;

const validateLocationUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === "") return null;
  if (!googleMapsUrlRegex.test(url)) return "location_url_invalid_format";
  return null;
};

const validateNotificationNum = (num: string | null | undefined): string | null => {
  if (!num || num.trim() === "") return null;
  if (!/^\d+$/.test(num) || num.length !== 10 || !num.startsWith('41')) return t('notification_num_invalid_format');
  return null;
};

const EditTaskForm: React.FC<EditTaskFormProps> = ({ task: initialTask, onClose, canEditOrDelete, canComplete }) => {
  const { tasksByIdMap, updateTask, deleteTaskPhoto } = useTasks();
  const { profile: currentUserProfile } = useSession();
  const { assignableUsers, loading: loadingUsers } = useAssignableUsers();
  const { t } = useTranslation();

  const currentTask = tasksByIdMap.get(initialTask.id) || initialTask;
  
  const [editedTask, setEditedTask] = useState<Partial<Task>>(() => currentTask);
  const [dueDateObject, setDueDateObject] = useState<Date | undefined>(
    currentTask.due_date ? new Date(currentTask.due_date) : undefined
  );
  const [isSaving, setIsSaving] = useState(false);
  const [notificationNumError, setNotificationNumError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setEditedTask(currentTask);
    setDueDateObject(currentTask.due_date ? new Date(currentTask.due_date) : undefined);
  }, [currentTask]);

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

    const dueDateString = dueDateObject ? dueDateObject.toISOString().split('T')[0] : null;
    const updatesToSend: Partial<Task> = { ...editedTask, due_date: dueDateString };

    const success = await updateTask(currentTask.id, updatesToSend);
    setIsSaving(false);

    if (success) {
      toast.success(t('task_updated_successfully'));
      onClose();
    }
  };

  const handleMultiPhotoUploadSuccess = useCallback(async (photoType: 'before' | 'after', url: string) => {
    const photoUrlKey = `photo_${photoType}_urls` as 'photo_before_urls' | 'photo_after_urls';
    const existingUrls = currentTask[photoUrlKey] || [];
    const newUrls = [...existingUrls, url];
    await updateTask(currentTask.id, { [photoUrlKey]: newUrls });
  }, [currentTask, updateTask]);

  const handlePermitUploadSuccess = useCallback(async (url: string) => {
    await updateTask(currentTask.id, { photo_permit_url: url });
  }, [currentTask.id, updateTask]);

  const handleMultiPhotoRemove = useCallback(async (photoType: 'before' | 'after', urlToRemove: string) => {
    const photoUrlKey = `photo_${photoType}_urls` as 'photo_before_urls' | 'photo_after_urls';
    const existingUrls = currentTask[photoUrlKey] || [];
    const newUrls = existingUrls.filter(url => url !== urlToRemove);
    await deleteTaskPhoto(urlToRemove);
    await updateTask(currentTask.id, { [photoUrlKey]: newUrls });
  }, [currentTask, updateTask, deleteTaskPhoto]);

  const handlePermitRemove = useCallback(async () => {
    const currentUrl = currentTask.photo_permit_url;
    if (currentUrl) {
      await deleteTaskPhoto(currentUrl);
    }
    await updateTask(currentTask.id, { photo_permit_url: null });
  }, [currentTask.id, currentTask.photo_permit_url, updateTask, deleteTaskPhoto]);

  const isPendingStatus = currentTask.status === 'unassigned' || currentTask.status === 'assigned';
  const isManagerOrSupervisor = currentUserProfile && ['manager', 'supervisor'].includes(currentUserProfile.role);

  // The assignee dropdown should be disabled if:
  // 1. The user does not have general edit permissions for the task (`!canEditOrDelete`).
  // 2. OR, if the current user is a 'manager' or 'supervisor' AND the task is *not* in a 'pending' status.
  const isAssigneeDropdownDisabled = !canEditOrDelete || (isManagerOrSupervisor && !isPendingStatus);

  return (
    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
      <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
        <Label htmlFor="title" className="md:text-right">{t('task_title')}</Label>
        <Input id="title" value={editedTask.title || ''} onChange={(e) => setEditedTask({...editedTask, title: e.target.value})} className="md:col-span-3" disabled={!canEditOrDelete} />
      </div>
      <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
        <Label htmlFor="description" className="md:text-right">{t('description_optional')}</Label>
        <Textarea id="description" value={editedTask.description || ""} onChange={(e) => setEditedTask({...editedTask, description: e.target.value})} className="md:col-span-3" disabled={!canEditOrDelete} />
      </div>
      <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
        <Label htmlFor="location" className="md:text-right">{t('location')}</Label>
        <Input
          id="location"
          value={editedTask.location || ''}
          onChange={handleLocationChange}
          placeholder={t('location_placeholder')}
          className="md:col-span-3"
          disabled={!canEditOrDelete}
        />
        {locationError && <p className="col-span-4 text-right text-destructive text-sm">{locationError}</p>}
      </div>
      <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
        <Label htmlFor="taskId" className="md:text-right">{t('task_id')}</Label>
        <Input id="taskId" value={editedTask.task_id || ''} className="md:col-span-3" readOnly disabled={true} />
      </div>
      <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
        <Label htmlFor="dueDate" className="md:text-right">{t('due_date')}</Label>
        <div className="md:col-span-3">
          <DatePicker date={dueDateObject} setDate={setDueDateObject} disabled={!canEditOrDelete} placeholder={t('pick_a_date')} />
        </div>
      </div>
      <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
        <Label htmlFor="typeOfWork" className="md:text-right">{t('type_of_work')}</Label>
        <Select onValueChange={(value: Task['typeOfWork']) => setEditedTask({...editedTask, type_of_work: value})} value={editedTask.type_of_work || ""} disabled={!canEditOrDelete}>
          <SelectTrigger id="typeOfWork" className="md:col-span-3">
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
      <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
        <Label htmlFor="equipmentNumber" className="md:text-right">{t('equipment_number')}</Label>
        <Input id="equipmentNumber" value={editedTask.equipment_number || ''} onChange={(e) => setEditedTask({...editedTask, equipment_number: e.target.value})} className="md:col-span-3" disabled={!canEditOrDelete} />
      </div>
      <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
        <Label htmlFor="notificationNum" className="md:text-right">{t('notification_num')}</Label>
        <Input
          id="notificationNum"
          value={editedTask.notification_num || ''}
          onChange={handleNotificationNumChange}
          className="md:col-span-3"
          maxLength={10}
          disabled={!(canEditOrDelete || canComplete)}
        />
        {notificationNumError && <p className="col-span-4 text-right text-destructive text-sm">{notificationNumError}</p>}
      </div>
      <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
        <Label htmlFor="priority" className="md:text-right">{t('priority')}</Label>
        <Select onValueChange={(value: Task['priority']) => setEditedTask({...editedTask, priority: value})} value={editedTask.priority || "medium"} disabled={!canEditOrDelete}>
          <SelectTrigger id="priority" className="md:col-span-3">
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
      <div className="space-y-2 md:grid md:grid-cols-4 md:items-center md:gap-4">
        <Label htmlFor="assignee" className="md:text-right">{t('assign_to')}</Label>
        <Select onValueChange={(value) => setEditedTask({...editedTask, assignee_id: value === "unassigned" ? null : value})} value={editedTask.assignee_id || "unassigned"} disabled={isAssigneeDropdownDisabled}>
          <SelectTrigger id="assignee" className="md:col-span-3">
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
          <MultiPhotoUploader
            label={t('before_work_photo')}
            taskId={currentTask.id}
            photoType="before"
            currentUrls={currentTask.photo_before_urls}
            onUploadSuccess={(url) => handleMultiPhotoUploadSuccess('before', url)}
            onRemove={(url) => handleMultiPhotoRemove('before', url)}
          />
          <MultiPhotoUploader
            label={t('after_work_photo')}
            taskId={currentTask.id}
            photoType="after"
            currentUrls={currentTask.photo_after_urls}
            onUploadSuccess={(url) => handleMultiPhotoUploadSuccess('after', url)}
            onRemove={(url) => handleMultiPhotoRemove('after', url)}
          />
          <PhotoUploader
            label={t('permit_photo')}
            taskId={currentTask.id}
            photoType="permit"
            currentUrl={currentTask.photo_permit_url}
            onUploadSuccess={handlePermitUploadSuccess}
            onRemove={handlePermitRemove}
          />
        </>
      )}
      <Button onClick={handleSaveEdit} disabled={isSaving || !!notificationNumError || !!locationError}>{t('save_changes')}</Button>
    </div>
  );
};

export default EditTaskForm;