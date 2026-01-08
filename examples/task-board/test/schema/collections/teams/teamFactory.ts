import { associations, factory } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { teamModel, UserModel, userModel } from '@test/schema/models';
import type { TestCollections } from '@test/schema/types';

export const teamFactory = factory<TestCollections>()
  .model(teamModel)
  .attrs({
    createdAt: () => faker.date.past().toISOString(),
    department: () => faker.commerce.department(),
    description: () => faker.company.catchPhrase(),
    name: () => faker.company.name(),
  })
  .traits({
    withManager: {
      // TODO: Try to simplify generic type for association methods
      manager: associations.create<TestCollections, UserModel>(userModel, 'manager'),
    },
    withMembers: {
      afterCreate(team, schema) {
        schema.users.createMany(10, { team }, 'withTasks');
      },
    },
  })
  .create();
