export type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'unassigned' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  assigneeId?: string | null;
  location?: string; // New field
  workOrderNumber?: string; // New field
  dueDate?: Date | null; // New field
};