import { TaskStatus, TaskPriority } from './enums';
import type { SimpleTeam } from './team';
import type { SimpleUser } from './user';

/**
 * Task entity type
 */
export interface Task {
  id: string;
  assignee: SimpleUser;
  createdAt: string;
  creator: SimpleUser;
  description: string;
  dueDate: string;
  number: number;
  prefix: string;
  priority: TaskPriority;
  status: TaskStatus;
  team: SimpleTeam;
  title: string;
  updatedAt: string;
}

export type SimpleTask = Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'dueDate'>;
