"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTasks } from "@/context/TaskContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/types/task";
import { useTranslation } from 'react-i18next';
import { useAssignableUsers } from "@/hooks/use-assignable-users";
import { useSession } from "@/context/SessionContext";

const TaskForm: React.FC = () => {
  const { addTask } = useTasks();
  const { assignableUsers, loading: loadingUsers } = useAssignableUsers();
  const { profile: currentUserProfile } = useSession();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [typeOfWork, setTypeOfWork] = useState<Task['typeOfWork'] | undefined>(undefined);
  const [equipmentNumber, setEquipmentNumber] = useState("");
  const [notificationNum, setNotificationNum] = useState("");
  const [priority, setPriority] = useState<Task['priority']>('medium'); // New state for priority
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (title.trim() === "") {
      toast.error(t('task_title_cannot_be_empty'));
      setLoading(false);
      return;
    }
    if (equipmentNumber.trim() === "") {
      toast.error(t('equipment_number_mandatory'));
      setLoading(false);
      return;
    }
    // Optional validation for notificationNum during creation
    if (notificationNum.trim() !== "" && (!notificationNum.startsWith('41') || notificationNum.length !== 10 || !/^\d+$/.test(notificationNum))) {
      toast.error(t('notification_num_invalid_format'));
      setLoading(false);
      return;
    }

    await addTask(title, description, location, dueDate, assigneeId, typeOfWork, equipmentNumber, notificationNum.trim() === "" ? undefined : notificationNum, priority);
    setTitle("");
    setDescription("");
    setLocation("");
    setDueDate("");
    setAssigneeId(null);
    setTypeOfWork(undefined);
    setEquipmentNumber("");
    setNotificationNum("");
    setPriority('medium'); // Reset priority
    toast.success(t('task_added_successfully'));
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('add_new_task')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t('task_title')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Fix leaky faucet"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">{t('description_optional')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Kitchen sink, constant drip"
            />
          </div>
          <div>
            <Label htmlFor="location">{t('location')}</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Apartment 3B"
            />
          </div>
          <div>
            <Label htmlFor="dueDate">{t('due_date')}</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="typeOfWork">{t('type_of_work')}</Label>
            <Select onValueChange={(value: Task['typeOfWork']) => setTypeOfWork(value)} value={typeOfWork || ""}>
              <SelectTrigger id="typeOfWork">
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
          <div>
            <Label htmlFor="equipmentNumber">{t('equipment_number')}</Label>
            <Input
              id="equipmentNumber"
              value={equipmentNumber}
              onChange={(e) => setEquipmentNumber(e.target.value)}
              placeholder="e.g., EQ-12345"
              required
            />
          </div>
          <div>
            <Label htmlFor="notificationNum">{t('notification_num_optional')}</Label>
            <Input
              id="notificationNum"
              value={notificationNum}
              onChange={(e) => setNotificationNum(e.target.value)}
              placeholder="e.g., 4100000000"
              maxLength={10}
            />
          </div>
          <div>
            <Label htmlFor="priority">{t('priority')}</Label>
            <Select onValueChange={(value: Task['priority']) => setPriority(value)} value={priority}>
              <SelectTrigger id="priority">
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
          <div>
            <Label htmlFor="assignee">{t('assign_to')}</Label>
            <Select onValueChange={(value) => setAssigneeId(value === "unassigned" ? null : value)} value={assigneeId || "unassigned"}>
              <SelectTrigger id="assignee">
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('loading') : t('add_task')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TaskForm;