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
import { useProfiles } from "@/hooks/use-profiles"; // Import the new hook
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const TaskForm: React.FC = () => {
  const { addTask } = useTasks();
  const { profiles, loading: profilesLoading } = useProfiles(); // Use the profiles hook
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === "") {
      toast.error("Task title cannot be empty.");
      return;
    }
    addTask(title, description, assigneeId, location, workOrderNumber, dueDate);
    setTitle("");
    setDescription("");
    setLocation("");
    setWorkOrderNumber("");
    setAssigneeId(null);
    setDueDate(null);
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
              placeholder="e.g., Buy groceries"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Milk, eggs, bread"
            />
          </div>
          <div>
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Store Aisle 5"
            />
          </div>
          <div>
            <Label htmlFor="workOrderNumber">Work Order Number (Optional)</Label>
            <Input
              id="workOrderNumber"
              value={workOrderNumber}
              onChange={(e) => setWorkOrderNumber(e.target.value)}
              placeholder="e.g., WO-12345"
            />
          </div>
          <div>
            <Label htmlFor="assignee">Assignee (Optional)</Label>
            <Select onValueChange={setAssigneeId} value={assigneeId || ""}>
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select a technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {profilesLoading ? (
                  <SelectItem value="loading" disabled>Loading profiles...</SelectItem>
                ) : (
                  profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.first_name} {profile.last_name} ({profile.role})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate || undefined}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button type="submit" className="w-full">Add Task</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TaskForm;