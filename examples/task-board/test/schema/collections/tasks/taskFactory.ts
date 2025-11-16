import { factory, resolveFactoryAttr } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { TaskStatus, TaskPriority } from '@shared/types';
import { taskModel } from '@test/schema/models';

export const taskFactory = factory()
  .model(taskModel)
  .attrs({
    createdAt: () => faker.date.recent({ days: 14 }).toISOString(),
    description: () => faker.hacker.phrase(),
    dueDate(id) {
      const createdAt = resolveFactoryAttr(this.createdAt, id);

      return faker.date
        .between({
          from: createdAt,
          to: new Date(),
        })
        .toISOString();
    },
    priority: () => faker.helpers.enumValue(TaskPriority),
    status: () => faker.helpers.enumValue(TaskStatus),
    title: () =>
      `${faker.hacker.verb()} ${faker.hacker.adjective()} ${faker.hacker.noun()}`,
    updatedAt(id) {
      return resolveFactoryAttr(this.createdAt, id);
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
    overdue: {
      dueDate: () => faker.date.recent().toISOString(),
      priority: TaskPriority.URGENT,
    },
  })
  .create();
