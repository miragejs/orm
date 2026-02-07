import { TaskItem } from '@/shared/types';
import { taskModel, TaskModel } from '@test/schema/models/taskModel';
import { TestCollections } from '@test/schema/types';
import { Serializer } from 'miragejs-orm';

export const taskItemSerializer = new Serializer<
  TaskModel,
  TestCollections,
  TaskItem,
  TaskItem[]
>(taskModel, {
  select: ['id', 'title', 'status', 'priority', 'dueDate'],
  with: [],
});
