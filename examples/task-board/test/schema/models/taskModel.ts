import { model } from 'miragejs-orm';
import type { TaskStatus, TaskPriority } from '@shared/enums';
import type { Task } from '@shared/types';

export interface TaskAttrs {
  id: string;
  assigneeId: string;
  commentIds: string[];
  createdAt: string;
  creatorId: string;
  description: string;
  dueDate: string;
  number: number;
  prefix: string;
  priority: TaskPriority;
  status: TaskStatus;
  teamId: string;
  title: string;
  updatedAt: string;
}

export const taskModel = model()
  .name('task')
  .collection('tasks')
  .attrs<TaskAttrs>()
  .json<Task, Task[]>()
  .build();

export type TaskModel = typeof taskModel;
