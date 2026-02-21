import type { TaskStatus, TaskPriority } from '@shared/enums';
import type {
  MemberSortableColumn,
  TaskFilters,
  TaskSortableColumn,
} from '@shared/types';
import type { TableParams } from '@shared/utils';

/** Default pagination/sorting params for team members */
export const defaultMembersParams: TableParams<MemberSortableColumn> = {
  page: 0,
  pageSize: 5,
  sortBy: 'name',
  sortOrder: 'asc',
};

/** Default pagination/sorting params for team tasks */
export const defaultTasksParams: TableParams<TaskSortableColumn> = {
  page: 0,
  pageSize: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * Parse filter arrays from URL search params
 */
export function parseFilters(url: string): TaskFilters {
  const searchParams = new URL(url).searchParams;
  return {
    assigneeId: searchParams.getAll('assigneeId'),
    priority: searchParams.getAll('priority') as TaskPriority[],
    status: searchParams.getAll('status') as TaskStatus[],
  };
}
