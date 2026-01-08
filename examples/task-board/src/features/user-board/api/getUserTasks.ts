import type { SimpleTask } from '@shared/types';

export interface GetUserTasksResponse {
  tasks: SimpleTask[];
}

/**
 * Fetch all tasks for a specific user
 */
export async function getUserTasks(userId: string): Promise<GetUserTasksResponse> {
  const response = await fetch(`/api/users/${userId}/tasks`);

  if (!response.ok) {
    throw new Error('Failed to fetch user tasks');
  }

  return response.json();
}
