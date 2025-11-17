import { factory } from 'miragejs-orm';
import { faker } from '@faker-js/faker';
import { commentModel } from '@test/schema/models';

export const commentFactory = factory()
  .model(commentModel)
  .attrs({
    content: () => faker.hacker.phrase(),
    createdAt: () => faker.date.recent().toISOString(),
  })
  .create();
