import type { Task } from '@shared/types';

export interface GetTaskDetailsResponse {
  task: Task;
}

/**
 * Fetches detailed information about a specific task including comments.
 * @param taskId - The ID of the task to fetch
 * @returns A promise that resolves to the task details
 */
export async function getTaskDetails(taskId: string): Promise<Task> {
  const response = await fetch(`/api/tasks/${taskId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch task details');
  }

  const data: GetTaskDetailsResponse = await response.json();
  return data.task;
}
