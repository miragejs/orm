import { associations, factory } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { UserRole } from '@shared/enums';
import { teamModel, userModel } from '@test/schema/models';
import type { TestCollections } from '@test/schema/types';

export const userFactory = factory<TestCollections>()
  .model(userModel)
  .attrs({
    avatar: () => faker.image.avatar(),
    bio: () => faker.person.bio(),
    createdAt: () => faker.date.past().toISOString(),
    email: () => faker.internet.email(),
    name: () => faker.person.fullName(),
    role: UserRole.USER,
  })
  .traits({
    manager: { role: UserRole.MANAGER },
    withTasks: {
      afterCreate(user, schema) {
        const members = schema.users.findMany({ where: { teamId: user.teamId } });
        const taskCount = faker.number.int({ min: 1, max: 5 });

        for (let i = 0; i < taskCount; i++) {
          const creator = faker.helpers.arrayElement(members.models);

          schema.tasks.createMany(
            taskCount,
            {
              assigneeId: user.id,
              creatorId: creator.id,
              teamId: user.teamId,
            },
            'withComments',
          );
        }
      },
    },
  })
  .associations({
    team: associations.create(teamModel),
  })
  .build();
