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
import { useTechnicians } from "@/hooks/use-technicians"; // Import the new hook
import { Task } from "@/types/task"; // Import Task type for typeOfWork

const TaskForm: React.FC = () => {
  const { addTask } = useTasks();
  const { technicians, loading: loadingTechnicians } = useTechnicians();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [typeOfWork, setTypeOfWork] = useState<Task['typeOfWork'] | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === "") {
      toast.error("Task title cannot be empty.");
      return;
    }
    addTask(title, description, location, workOrderNumber, dueDate, assigneeId, typeOfWork);
    setTitle("");
    setDescription("");
    setLocation("");
    setWorkOrderNumber("");
    setDueDate("");
    setAssigneeId(null);
    setTypeOfWork(undefined);
    toast.success("Task added successfully!");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add New Task</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Fix leaky faucet"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Kitchen sink, constant drip"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Apartment 3B"
            />
          </div>
          <div>
            <Label htmlFor="workOrderNumber">Work Order Number</Label>
            <Input
              id="workOrderNumber"
              value={workOrderNumber}
              onChange={(e) => setWorkOrderNumber(e.target.value)}
              placeholder="e.g., WO-2024-001"
            />
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="typeOfWork">Type of Work</Label>
            <Select onValueChange={(value: Task['typeOfWork']) => setTypeOfWork(value)} value={typeOfWork || ""}>
              <SelectTrigger id="typeOfWork">
                <SelectValue placeholder="Select type of work" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Correction Maintenance">Correction Maintenance</SelectItem>
                <SelectItem value="Civil Work">Civil Work</SelectItem>
                <SelectItem value="Overhead Maintenance">Overhead Maintenance</SelectItem>
                <SelectItem value="Termination Maintenance">Termination Maintenance</SelectItem>
                <SelectItem value="Replacing Equipment">Replacing Equipment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="assignee">Assign Technician</Label>
            <Select onValueChange={(value) => setAssigneeId(value === "unassigned" ? null : value)} value={assigneeId || "unassigned"}>
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select a technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {loadingTechnicians ? (
                  <SelectItem value="loading" disabled>Loading technicians...</SelectItem>
                ) : (
                  technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name} ({tech.role})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Add Task</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TaskForm;