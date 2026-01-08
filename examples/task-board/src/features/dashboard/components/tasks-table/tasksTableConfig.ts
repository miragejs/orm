import { TaskStatus, TaskPriority, type TaskSortableColumn } from '@shared/types';

export interface ColumnConfig {
  id: TaskSortableColumn;
  label: string;
}

/** Table column definitions */
export const columns: ColumnConfig[] = [
  { id: 'title', label: 'Task' },
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'dueDate', label: 'Due Date' },
];

/** Available status filter options */
export const statusOptions = Object.values(TaskStatus);

/** Available priority filter options */
export const priorityOptions = Object.values(TaskPriority);

/** Status chip color mapping */
export const statusColors: Record<
  TaskStatus,
  'default' | 'info' | 'warning' | 'success'
> = {
  [TaskStatus.TODO]: 'default',
  [TaskStatus.IN_PROGRESS]: 'info',
  [TaskStatus.REVIEW]: 'warning',
  [TaskStatus.DONE]: 'success',
};

/** Priority chip color mapping */
export const priorityColors: Record<
  TaskPriority,
  'default' | 'info' | 'warning' | 'error'
> = {
  [TaskPriority.LOW]: 'default',
  [TaskPriority.MEDIUM]: 'info',
  [TaskPriority.HIGH]: 'warning',
  [TaskPriority.URGENT]: 'error',
};

/** Rows per page options for pagination */
export const rowsPerPageOptions = [5, 10, 25];
