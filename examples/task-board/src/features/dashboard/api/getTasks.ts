import type { Task } from '@shared/types';

/**
 * Fetch all tasks for the current user
 */
export async function getTasks(): Promise<GetTasksResponse> {
  const response = await fetch('/api/tasks');

  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }

  return response.json();
}

export interface GetTasksResponse {
  tasks: Task[];
}
