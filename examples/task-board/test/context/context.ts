import { test as baseTest } from 'vitest';

import { testSchema } from '../schema/testSchema';

export const test = baseTest.extend<{ schema: typeof testSchema }>({
  // eslint-disable-next-line no-empty-pattern
  schema: async ({}, use) => {
    await use(testSchema);
    // Teardown: runs automatically after each test that uses this fixture
    testSchema.db.emptyData();
  },
});
