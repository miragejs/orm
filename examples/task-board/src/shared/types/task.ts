import { TaskStatus, TaskPriority } from './enums';
import { Team } from './team';
import type { User } from './user';

/**
 * Task entity type
 */
export interface Task {
  id: string;
  assigneeId: string;
  createdAt: string;
  creatorId: string;
  description: string;
  dueDate: string;
  number: number;
  prefix: string;
  priority: TaskPriority;
  status: TaskStatus;
  teamId: string;
  title: string;
  updatedAt: string;
}

export type DetailedTask = Task & {
  assignee: User;
  creator: User;
  team: Team;
};
