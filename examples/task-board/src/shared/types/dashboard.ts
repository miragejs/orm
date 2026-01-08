import type { TaskPriority, TaskStatus } from './enums';

/** Sortable columns for members table */
export type MemberSortableColumn = 'name' | 'role' | 'email';

/** Sortable columns for tasks table */
export type TaskSortableColumn =
  | 'title'
  | 'status'
  | 'priority'
  | 'dueDate'
  | 'createdAt';

/** Simplified member type for dropdown options */
export interface MemberOption {
  avatar: string;
  id: string;
  name: string;
}

/** Task filter values */
export interface TaskFilters {
  assigneeId: string[];
  priority: TaskPriority[];
  status: TaskStatus[];
}

/** Task statistics aggregated by date */
export interface TaskStatistics {
  completed: number[];
  created: number[];
  dates: string[];
  inProgress: number[];
}
