export type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'unassigned' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'; // New status field
  createdAt: Date;
  assigneeId?: string | null;
};