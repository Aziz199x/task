export type Task = {
  id: string;
  created_at: string;
  title: string;
  description?: string | null;
  status: 'unassigned' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  assignee_id?: string | null;
  creator_id?: string | null;
  location?: string | null;
  work_order_number?: string | null;
  due_date?: string | null;
  type_of_work?: 'Correction Maintenance' | 'Civil Work' | 'Overhead Maintenance' | 'Termination Maintenance' | 'Replacing Equipment' | null;
  equipment_number: string;
  photo_before_url?: string | null;
  photo_after_url?: string | null;
  photo_permit_url?: string | null;
};