import type { Comment } from '@shared/types';

export interface GetTaskCommentsResponse {
  comments: Comment[];
}

/**
 * Fetches comments for a specific task.
 * @param taskId - The ID of the task to fetch comments for
 * @returns A promise that resolves to the task comments
 */
export async function getTaskComments(taskId: string): Promise<Comment[]> {
  const response = await fetch(`/api/tasks/${taskId}/comments`);

  if (!response.ok) {
    throw new Error('Failed to fetch task comments');
  }

  const { comments } = (await response.json()) as GetTaskCommentsResponse;
  return comments;
}
