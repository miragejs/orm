import { factory, resolveFactoryAttr, type ModelUpdateAttrs } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { TaskStatus, TaskPriority } from '@shared/enums';
import { TaskModel, taskModel } from '@test/schema/models';
import type { TestCollections } from '@test/schema/types';

const getTeamPrefix = (teamName?: string) => {
  if (!teamName) {
    return faker.hacker.abbreviation();
  }

  return teamName
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
};

export const taskFactory = factory<TestCollections>()
  .model(taskModel)
  .attrs({
    prefix: () => getTeamPrefix(),
    number: () => faker.number.int({ min: 1, max: 100 }),
    title: () =>
      `${faker.hacker.verb()} ${faker.hacker.adjective()} ${faker.hacker.noun()}`,
    description: () => faker.hacker.phrase(),
    priority: () => faker.helpers.enumValue(TaskPriority),
    status: () => faker.helpers.enumValue(TaskStatus),
    dueDate(id) {
      const createdAt = resolveFactoryAttr(this.createdAt, id);
      const dueDate = faker.date
        .between({ from: createdAt, to: new Date() })
        .toISOString();
      return dueDate;
    },
    createdAt() {
      return faker.date.recent({ days: 14 }).toISOString();
    },
    updatedAt(id) {
      const createdAt = resolveFactoryAttr(this.createdAt, id);
      const dueDate = resolveFactoryAttr(this.dueDate, id);
      return faker.date.between({ from: createdAt, to: dueDate }).toISOString();
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
        // Get members from the same team for comment authors
        const members = schema.users.findMany({ where: { teamId: task.teamId } });
        const commentCount = faker.number.int({ min: 1, max: 4 });

        // Generate comments with dates between task creation and now
        for (let i = 0; i < commentCount; i++) {
          const randomUser = faker.helpers.arrayElement(members.models);
          const createdAt = faker.date
            .between({ from: task.createdAt, to: task.updatedAt })
            .toISOString();

          schema.comments.create({ author: randomUser, createdAt, task });
        }
      },
    },
  })
  .afterCreate((task) => {
    const attrs: ModelUpdateAttrs<TaskModel, TestCollections> = {};

    if (task.creator) {
      if (!task.assignee) {
        attrs.assignee = task.creator;
      }

      if (!task.team) {
        attrs.team = task.creator.team;
        attrs.prefix = getTeamPrefix(task.creator.team?.name);
      }
    }

    if (task.team) {
      attrs.prefix = getTeamPrefix(task.team.name);
    }

    task.update(attrs);
  })
  .build();
