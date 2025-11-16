import { associations, factory } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { teamModel, userModel } from '@test/schema/models';
import type { AppCollections } from '@test/schema/types';

export const teamFactory = factory<AppCollections>()
  .model(teamModel)
  .attrs({
    createdAt: () => faker.date.past().toISOString(),
    department: () => faker.commerce.department(),
    description: () => faker.company.catchPhrase(),
    name: () => faker.company.name(),
  })
  .traits({
    withManager: {
      manager: associations.create(userModel, 'manager'),
    },
    withMembers: {
      members: associations.createMany(userModel, 3),
    },
  })
  .create();
