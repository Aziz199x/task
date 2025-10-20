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
import { useTechnicians } from "@/hooks/use-technicians";
import { Task } from "@/types/task";
import { useTranslation } from 'react-i18next'; // Import useTranslation

const TaskForm: React.FC = () => {
  const { addTask } = useTasks();
  const { technicians, loading: loadingTechnicians } = useTechnicians();
  const { t } = useTranslation(); // Initialize useTranslation

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [typeOfWork, setTypeOfWork] = useState<Task['typeOfWork'] | undefined>(undefined);
  const [equipmentNumber, setEquipmentNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === "") {
      toast.error(t('task_title_cannot_be_empty'));
      return;
    }
    if (equipmentNumber.trim() === "") {
      toast.error(t('equipment_number_mandatory'));
      return;
    }
    addTask(title, description, location, workOrderNumber, dueDate, assigneeId, typeOfWork, equipmentNumber);
    setTitle("");
    setDescription("");
    setLocation("");
    setWorkOrderNumber("");
    setDueDate("");
    setAssigneeId(null);
    setTypeOfWork(undefined);
    setEquipmentNumber("");
    toast.success(t('task_added_successfully'));
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
            <Label htmlFor="workOrderNumber">{t('work_order_number')}</Label>
            <Input
              id="workOrderNumber"
              value={workOrderNumber}
              onChange={(e) => setWorkOrderNumber(e.target.value)}
              placeholder="e.g., WO-2024-001"
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
            <Label htmlFor="assignee">{t('assign_technician')}</Label>
            <Select onValueChange={(value) => setAssigneeId(value === "unassigned" ? null : value)} value={assigneeId || "unassigned"}>
              <SelectTrigger id="assignee">
                <SelectValue placeholder={t('select_a_technician')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
                {loadingTechnicians ? (
                  <SelectItem value="loading" disabled>{t('loading_technicians')}...</SelectItem>
                ) : (
                  technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name} ({t(tech.role)})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">{t('add_task')}</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TaskForm;