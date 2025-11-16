import { model } from 'miragejs-orm';
import { TaskStatus, TaskPriority } from '@shared/types';

export interface TaskAttrs {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  assigneeId: string;
  teamId: string;
}

export const taskModel = model()
  .name('task')
  .collection('tasks')
  .attrs<TaskAttrs>()
  .create();

export type TaskModel = typeof taskModel;
