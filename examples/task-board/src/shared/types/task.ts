import { TaskStatus, TaskPriority } from '../enums';
import type { TeamInfo } from './team';
import type { UserInfo } from './user';

/**
 * Task entity type
 */
export interface Task {
  id: string;
  assignee: UserInfo;
  createdAt: string;
  creator: UserInfo;
  description: string;
  dueDate: string;
  number: number;
  prefix: string;
  priority: TaskPriority;
  status: TaskStatus;
  team: TeamInfo;
  title: string;
  updatedAt: string;
}

export type TaskItem = Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'dueDate'>;
