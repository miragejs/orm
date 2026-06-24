import { associations, factory, type ModelUpdateAttrs } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { TaskStatus, TaskPriority } from '@shared/enums';
import { taskModel, userModel } from '@test/schema/models';
import type { TaskModel, UserModel } from '@test/schema/models';
import type { TestCollections } from '@test/schema';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
    // Dates are built so they are always well-ordered and fall on distinct
    // calendar days: createdAt < updatedAt < dueDate. This keeps the factory
    // deterministic enough for the UI (which renders dates with
    // toLocaleDateString(), dropping the time) and avoids inverted ranges when
    // dueDate is overridden (e.g. the `overdue` trait or an explicit value).
    createdAt() {
      // 30–60 days ago
      return faker.date
        .recent({ days: 30, refDate: new Date(Date.now() - 30 * MS_PER_DAY) })
        .toISOString();
    },
    updatedAt() {
      // 1–14 days after createdAt (independent of dueDate)
      const createdAt = new Date(this.createdAt).getTime();
      return faker.date
        .between({
          from: new Date(createdAt + MS_PER_DAY),
          to: new Date(createdAt + 14 * MS_PER_DAY),
        })
        .toISOString();
    },
    dueDate() {
      // 15–45 days after createdAt (a distinct day, always after createdAt)
      const createdAt = new Date(this.createdAt).getTime();
      return faker.date
        .between({
          from: new Date(createdAt + 15 * MS_PER_DAY),
          to: new Date(createdAt + 45 * MS_PER_DAY),
        })
        .toISOString();
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
    // Create a new user for the task assignee
    withAssignee: {
      assignee: associations.create<UserModel, TestCollections>(userModel),
    },
    // Create comments for the task
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
  .associations({
    // Link to the current user if found, else create a new one
    creator: associations.link<UserModel, TestCollections>(userModel),
  })
  .afterCreate((task) => {
    const attrs: ModelUpdateAttrs<TaskModel, TestCollections> = {};

    if (task.creator) {
      // Assign the creator to the task if no assignee is set
      if (!task.assignee) {
        attrs.assignee = task.creator;
      }

      // Link to the creator's team
      if (!task.team) {
        attrs.team = task.creator.team;
      }
    }

    // Set the team prefix for the current or inherited team
    const currentTeam = task.team || attrs.team;
    if (currentTeam) {
      attrs.prefix = getTeamPrefix(currentTeam.name);
    }

    task.update(attrs);
  })
  .build();
