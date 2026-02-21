import kebabCase from 'lodash.kebabcase';
import { associations, factory, resolveFactoryAttr } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { teamModel, UserModel, userModel } from '@test/schema/models';
import type { TestCollections } from '@test/schema';

export const teamFactory = factory<TestCollections>()
  .model(teamModel)
  .attrs({
    createdAt: () => faker.date.past().toISOString(),
    department: () => faker.commerce.department(),
    description: () => faker.company.catchPhrase(),
    name: () => faker.company.name(),
    slug(id) {
      const name = resolveFactoryAttr(this.name, id);
      return kebabCase(name);
    },
  })
  .traits({
    withManager: {
      manager: associations.create<UserModel, TestCollections>(userModel, 'manager'),
    },
    withMembers: {
      members: associations.createMany<UserModel, TestCollections>(
        userModel,
        10,
        'withTasksAndComments',
      ),
    },
  })
  .build();
