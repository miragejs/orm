import { TaskStatus, TaskPriority } from '@shared/enums';
import type { Task } from '@shared/types';

export interface UpdateTaskPayload {
  assigneeId?: string | null;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  title?: string;
}

/**
 * Updates an existing task.
 */
export async function updateTask(
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<Task> {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Failed to update task');
  }

  return response.json();
}
