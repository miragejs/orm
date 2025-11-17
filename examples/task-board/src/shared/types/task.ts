import { TaskStatus, TaskPriority } from './enums';
import type { Comment } from './comment';
import type { User } from './user';

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
  teamId?: string;
  creatorId: string;
}

/**
 * Task with full details including relationships
 */
export interface TaskDetails extends Task {
  assignee?: User;
  creator?: User;
  comments?: Comment[];
}
