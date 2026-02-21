import type { Task, TaskFormValues } from '@shared/types';
import { formatTaskDueDate } from './formatTaskDueDate';

export function getTaskFormValues(task: Task): TaskFormValues {
  return {
    assigneeId: task.assignee?.id ?? '',
    description: task.description ?? '',
    dueDate: formatTaskDueDate(task.dueDate),
    priority: task.priority,
    status: task.status,
    title: task.title,
  };
}
