import { TaskPriority, TaskStatus } from '@shared/enums';
import type { TaskFormValues, UserInfo } from '@shared/types';
import { formatDateForInput } from './formatDateForInput';

export function defaultFormValues(
  members: UserInfo[],
  defaultAssigneeId?: string,
): TaskFormValues {
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 7);
  const assigneeId =
    defaultAssigneeId && members.some((m) => m.id === defaultAssigneeId)
      ? defaultAssigneeId
      : (members[0]?.id ?? '');
  return {
    assigneeId,
    description: '',
    dueDate: formatDateForInput(defaultDue.toISOString()),
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    title: '',
  };
}
