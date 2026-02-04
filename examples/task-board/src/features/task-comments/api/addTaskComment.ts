import type { Comment } from '@shared/types';

/**
 * Adds a new comment to a specific task.
 * @param taskId - The ID of the task to add the comment to
 * @param content - The content of the comment
 * @returns A promise that resolves to the created comment
 */
export async function addTaskComment(taskId: string, content: string): Promise<Comment> {
  const response = await fetch(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error('Failed to add comment');
  }

  return response.json();
}
