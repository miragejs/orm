import { associations, factory } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { UserRole } from '@shared/types';
import { taskModel, teamModel, userModel } from '@test/schema/models';
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
    withTasks: { tasks: associations.createMany(taskModel, 5) },
  })
  .associations({
    team: associations.create(teamModel),
  })
  .create();
