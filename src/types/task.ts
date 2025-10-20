export type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'unassigned' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  assigneeId?: string | null; // This will now refer to the user ID of the assigned technician
  location?: string; // New field
  workOrderNumber?: string; // New field
  dueDate?: string; // New field (using string for simplicity with input type="date")
  typeOfWork?: 'Correction Maintenance' | 'Civil Work' | 'Overhead Maintenance' | 'Termination Maintenance' | 'Replacing Equipment'; // New field for type of work
  equipmentNumber: string; // New mandatory field
};