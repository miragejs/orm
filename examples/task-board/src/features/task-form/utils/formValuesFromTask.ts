import type { Task, TaskFormValues } from '@shared/types';
import { formatDateForInput } from './formatDateForInput';

export function formValuesFromTask(task: Task): TaskFormValues {
  return {
    assigneeId: task.assignee?.id ?? '',
    description: task.description ?? '',
    dueDate: formatDateForInput(task.dueDate),
    priority: task.priority,
    status: task.status,
    title: task.title,
  };
}
