import { associations, factory } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { commentModel, userModel } from '@test/schema/models';

export const commentFactory = factory()
  .model(commentModel)
  .attrs({
    content: () => faker.hacker.phrase(),
    createdAt: () => faker.date.recent().toISOString(),
  })
  .associations({
    author: associations.link(userModel),
  })
  .build();
