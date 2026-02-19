import { TaskStatus, TaskPriority } from '@shared/enums';
import type { Task } from '@shared/types';

export interface CreateTaskPayload {
  assigneeId: string | null;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
}

/**
 * Creates a new task for the current user's team.
 */
export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Failed to create task');
  }

  return response.json();
}
