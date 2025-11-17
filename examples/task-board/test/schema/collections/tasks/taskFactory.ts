import { factory, resolveFactoryAttr } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { TaskStatus, TaskPriority } from '@shared/types';
import { taskModel } from '@test/schema/models';
import type { AppCollections } from '@test/schema/types';

export const taskFactory = factory<AppCollections>()
  .model(taskModel)
  .attrs({
    createdAt: () => faker.date.recent({ days: 14 }).toISOString(),
    description: () => faker.hacker.phrase(),
    dueDate(id) {
      const createdAt = resolveFactoryAttr(this.createdAt, id);
      return faker.date.between({ from: createdAt, to: new Date() }).toISOString();
    },
    priority: () => faker.helpers.enumValue(TaskPriority),
    status: () => faker.helpers.enumValue(TaskStatus),
    title: () =>
      `${faker.hacker.verb()} ${faker.hacker.adjective()} ${faker.hacker.noun()}`,
    updatedAt(id) {
      const createdAt = resolveFactoryAttr(this.createdAt, id);
      return faker.date.between({ from: createdAt, to: new Date() }).toISOString();
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
  .traits({
    withComments: {
      afterCreate(task, schema) {
        // Get users for comment authors (current user and manager)
        const currentUser = schema.users.find({ email: 'john.doe@example.com' });
        const managerUser = schema.users.find({ email: 'jane.smith@example.com' });

        if (!currentUser || !managerUser) return;

        const users = [currentUser, managerUser];
        const commentCount = faker.number.int({ min: 2, max: 4 });

        // Generate comments with dates between task creation and now
        for (let i = 0; i < commentCount; i++) {
          const randomUser = faker.helpers.arrayElement(users);
          const createdAt = faker.date
            .between({ from: task.createdAt, to: task.updatedAt })
            .toISOString();

          schema.comments.create({
            author: randomUser,
            createdAt,
            task,
          });
        }
      },
    },
  })
  .create();
