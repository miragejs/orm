import { TaskItem } from '@/shared/types';
import { taskModel, TaskModel } from '@test/schema/models/taskModel';
import { Serializer } from 'miragejs-orm';
import type { TestCollections } from '@test/schema';

export const taskItemSerializer = new Serializer<
  TaskModel,
  TestCollections,
  TaskItem,
  TaskItem[]
>(taskModel, {
  select: ['id', 'title', 'status', 'priority', 'dueDate'],
  with: [],
});
