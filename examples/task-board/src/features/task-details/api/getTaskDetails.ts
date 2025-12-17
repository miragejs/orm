import type { DetailedTask } from '@shared/types';

export interface GetTaskDetailsResponse {
  task: DetailedTask;
}

/**
 * Fetches detailed information about a specific task including comments.
 * @param taskId - The ID of the task to fetch
 * @returns A promise that resolves to the task details
 */
export async function getTaskDetails(taskId: string): Promise<DetailedTask> {
  const response = await fetch(`/api/tasks/${taskId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch task details');
  }

  const { task } = (await response.json()) as GetTaskDetailsResponse;
  return task;
}
