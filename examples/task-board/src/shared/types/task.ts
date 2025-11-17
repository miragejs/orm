import { TaskStatus, TaskPriority } from './enums';

/**
 * Task entity type
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  assigneeId: string;
}
