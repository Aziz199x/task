export type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  assigneeId?: string | null; // New field for task assignment
};