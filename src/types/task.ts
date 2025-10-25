export type Task = {
  id: string;
  created_at: string;
  title: string;
  description?: string | null;
  status: 'unassigned' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  assignee_id?: string | null;
  creator_id?: string | null;
  closed_by_id?: string | null; // New field for who closed the task
  closed_at?: string | null; // New field for when the task was closed
  location?: string | null;
  task_id?: string | null;
  due_date?: string | null;
  type_of_work?: 'Correction Maintenance' | 'Civil Work' | 'Overhead Maintenance' | 'Termination Maintenance' | 'Replacing Equipment' | null;
  equipment_number: string;
  notification_num?: string | null;
  photo_before_url?: string | null; // New field for photo before work
  photo_after_url?: string | null;  // New field for photo after work
  photo_permit_url?: string | null; // New field for permit photo
  priority?: 'low' | 'medium' | 'high' | 'urgent'; // New field: Task Priority
};