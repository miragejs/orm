import { factory } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { TaskStatus, TaskPriority } from '@shared/types';
import { taskModel } from '@test/schema/models';

export const taskFactory = factory()
  .model(taskModel)
  .attrs({
    createdAt: () => faker.date.recent({ days: 14 }).toISOString(),
    description: () => faker.lorem.paragraphs(2),
    dueDate: () => faker.date.soon({ days: 7 }).toISOString(),
    priority: () => faker.helpers.enumValue(TaskPriority),
    status: () => faker.helpers.enumValue(TaskStatus),
    title: () => faker.lorem.sentence(),
    updatedAt() {
      return faker.date.between({ from: this.createdAt, to: new Date() }).toISOString();
    },
  })
  .traits({
    done: { status: TaskStatus.DONE },
    inProgress: { status: TaskStatus.IN_PROGRESS },
    review: { status: TaskStatus.REVIEW },
    todo: { status: TaskStatus.TODO },
  })
  .traits({
    lowPriority: { priority: TaskPriority.LOW },
    highPriority: { priority: TaskPriority.HIGH },
    urgent: { priority: TaskPriority.URGENT },
  })
  .traits({
    overdue: { dueDate: () => faker.date.recent().toISOString() },
  })
  .create();
