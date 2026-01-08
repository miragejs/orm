import type { MemberOption, Task, TaskFilters, TaskSortableColumn } from '@shared/types';
import type { TableParams } from '@shared/utils';

export interface GetTeamTasksResponse extends TableParams<TaskSortableColumn> {
  filters: TaskFilters;
  memberOptions: MemberOption[];
  tasks: Task[];
  total: number;
}

/**
 * Fetch team tasks with pagination, sorting, and filtering
 * @param searchParams - URL search params string or URLSearchParams object
 */
export async function getTeamTasks(
  searchParams?: string | URLSearchParams,
): Promise<GetTeamTasksResponse> {
  const query = searchParams?.toString() || '';
  const response = await fetch(`/api/teams/me/tasks?${query}`);

  if (!response.ok) {
    throw new Error('Failed to fetch team tasks');
  }

  const data: GetTeamTasksResponse = await response.json();
  return data;
}
