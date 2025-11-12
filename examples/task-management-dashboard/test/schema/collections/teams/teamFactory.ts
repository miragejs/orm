import { factory } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { teamModel } from '@test/schema/models';

export const teamFactory = factory()
  .model(teamModel)
  .attrs({
    createdAt: () => faker.date.past().toISOString(),
    department: () => faker.commerce.department(),
    description: () => faker.company.catchPhrase(),
    name: () => faker.company.name(),
  })
  .create();
