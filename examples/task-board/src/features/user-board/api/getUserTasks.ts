import type { TaskItem } from '@shared/types';

/**
 * Fetch all tasks for a specific user
 */
export async function getUserTasks(userId: string): Promise<TaskItem[]> {
  const response = await fetch(`/api/users/${userId}/tasks`);

  if (!response.ok) {
    throw new Error('Failed to fetch user tasks');
  }

  return response.json();
}
