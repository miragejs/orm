import upperFirst from 'lodash.upperfirst';
import type { Task } from '@shared/types';

/**
 * Formats a task title in Jira-like format: PREFIX-NUMBER: Title
 * @param task - The task object
 * @returns Formatted task title
 */
export function formatTaskTitle(task: Task): string {
  const formattedTitle = upperFirst(task.title.toLowerCase());
  return `${task.prefix}-${task.number}: ${formattedTitle}`;
}
