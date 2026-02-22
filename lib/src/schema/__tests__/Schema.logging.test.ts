import { factory } from '@src/factory';
import { model } from '@src/model';
import type { Mock } from 'vitest';

import { collection } from '../CollectionBuilder';
import { schema } from '../SchemaBuilder';
import type { CollectionConfig } from '../types';

// ANSI color codes for matching colored log output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m', // DEBUG
  gray: '\x1b[90m', // LOG
  blue: '\x1b[34m', // INFO
  yellow: '\x1b[33m', // WARN
  red: '\x1b[31m', // ERROR
};

// Helper to create expected colored message
const coloredLevel = (level: 'DEBUG' | 'LOG' | 'INFO' | 'WARN' | 'ERROR') => {
  const colorMap = {
    DEBUG: COLORS.green,
    LOG: COLORS.gray,
    INFO: COLORS.blue,
    WARN: COLORS.yellow,
    ERROR: COLORS.red,
  };
  return `${colorMap[level]}${level}${COLORS.reset}`;
};

// Define test model attributes
interface UserAttrs {
  id: string;
  name: string;
  postIds?: string[];
}

interface PostAttrs {
  id: string;
  title: string;
  authorId?: string | null;
}

// Create test models
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .build();
const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<PostAttrs>()
  .build();

// Create test factories
const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => 'John Doe',
  })
  .build();

const postFactory = factory()
  .model(postModel)
  .attrs({
    title: () => 'Test Post',
  })
  .build();

// Define test schema type
type TestSchema = {
  users: CollectionConfig<typeof userModel>;
  posts: CollectionConfig<typeof postModel>;
};

describe('Schema with Logging', () => {
  let consoleLogSpy: Mock<typeof vi.spyOn>;
  let consoleWarnSpy: Mock<typeof vi.spyOn>;
  let consoleErrorSpy: Mock<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Schema initialization', () => {
    it('should log schema initialization at info level', () => {
      schema()
        .logging({ enabled: true, level: 'info' })
        .collections({
          users: collection<TestSchema>().model(userModel).build(),
        })
        .build();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('INFO')}: All collections registered`,
        expect.objectContaining({
          count: 1,
          names: ['users'],
        }),
      );
    });

    it('should not log when logging is disabled', () => {
      schema()
        .logging({ enabled: false, level: 'debug' })
        .collections({
          users: collection<TestSchema>().model(userModel).build(),
        })
        .build();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log when logging is not configured', () => {
      schema()
        .collections({
          users: collection<TestSchema>().model(userModel).build(),
        })
        .build();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log collection registration', () => {
      schema()
        .logging({ enabled: true, level: 'log' })
        .collections({
          users: collection<TestSchema>().model(userModel).build(),
          posts: collection<TestSchema>().model(postModel).build(),
        })
        .build();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Registering collections`,
        expect.objectContaining({
          count: 2,
          names: ['users', 'posts'],
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('INFO')}: All collections registered`,
        expect.objectContaining({
          count: 2,
          names: ['users', 'posts'],
        }),
      );
    });
  });

  describe('Collection operations logging', () => {
    it('should log model creation at debug level', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Alice' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Creating model for 'users'`,
        expect.objectContaining({
          collection: 'users',
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('DEBUG')}: Built attributes for 'users'`,
        expect.objectContaining({
          id: expect.any(String),
          attrs: expect.objectContaining({
            name: 'Alice',
          }),
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('DEBUG')}: Saved model for 'users'`,
        expect.objectContaining({
          id: expect.any(String),
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('DEBUG')}: Processed associations for 'users'`,
        expect.objectContaining({
          id: expect.any(String),
          relValues: expect.any(Object),
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('INFO')}: Created model for 'users'`,
        expect.objectContaining({
          id: expect.any(String),
        }),
      );
    });

    it('should log at info level without debug details', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'info' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      // Clear previous logs from schema initialization
      consoleLogSpy.mockClear();

      testSchema.users.create({ name: 'Alice' });

      // Should have INFO logs (end message)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('INFO')}: Created model for 'users'`,
        expect.anything(),
      );

      // Should not have DEBUG or LOG logs
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('DEBUG'),
        expect.anything(),
      );
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(`${coloredLevel('LOG')}`),
        expect.anything(),
      );
    });
  });

  describe('Query operations logging', () => {
    it('should log find operation with LOG start and INFO end', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      const user = testSchema.users.create({ name: 'Alice' });
      consoleLogSpy.mockClear();

      testSchema.users.find(user.id);

      // BaseCollection LOG start
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Finding model in 'users'`,
        expect.objectContaining({
          input: user.id,
        }),
      );

      // DbCollection DEBUG internal
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('DEBUG')}: Found 1 records in 'users'`,
        expect.objectContaining({
          query: user.id,
        }),
      );

      // BaseCollection LOG end
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Found 1 model in 'users'`,
        expect.objectContaining({
          id: user.id,
        }),
      );
    });

    it('should log findMany operation with LOG start and LOG end', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Alice' });
      testSchema.users.create({ name: 'Bob' });
      consoleLogSpy.mockClear();

      testSchema.users.findMany({ name: 'Alice' });

      // BaseCollection LOG start
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Finding models in 'users'`,
        expect.objectContaining({
          input: { name: 'Alice' },
        }),
      );

      // DbCollection DEBUG internal
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('DEBUG')}: Found 1 records in 'users'`,
        expect.objectContaining({
          query: { name: 'Alice' },
        }),
      );

      // BaseCollection LOG end
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Found 1 models in 'users'`,
        expect.objectContaining({
          ids: expect.any(Array),
        }),
      );
    });

    it('should log all() operation with LOG start and LOG end', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Alice' });
      testSchema.users.create({ name: 'Bob' });
      consoleLogSpy.mockClear();

      testSchema.users.all();

      // BaseCollection LOG start
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Fetching all models from 'users'`,
        '',
      );

      // BaseCollection LOG end
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Fetched 2 models from 'users'`,
        '',
      );
    });

    it('should log first() operation with LOG start and LOG end', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Alice' });
      consoleLogSpy.mockClear();

      testSchema.users.first();

      // BaseCollection LOG start
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Fetching first model from 'users'`,
        '',
      );

      // BaseCollection LOG end
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Fetched first model from 'users'`,
        expect.objectContaining({
          found: true,
        }),
      );
    });

    it('should log count() operation with LOG start and LOG end', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Alice' });
      testSchema.users.create({ name: 'Bob' });
      consoleLogSpy.mockClear();

      const result = testSchema.users.count();

      expect(result).toBe(2);

      // BaseCollection LOG start
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Counting models in 'users'`,
        expect.objectContaining({
          where: undefined,
        }),
      );

      // BaseCollection LOG end
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Counted 2 models in 'users'`,
        '',
      );
    });

    it('should log count() operation with where clause', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Alice' });
      testSchema.users.create({ name: 'Bob' });
      consoleLogSpy.mockClear();

      const result = testSchema.users.count({ name: 'Alice' });

      expect(result).toBe(1);

      // BaseCollection LOG start with where clause
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Counting models in 'users'`,
        expect.objectContaining({
          where: { name: 'Alice' },
        }),
      );

      // BaseCollection LOG end
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Counted 1 models in 'users'`,
        '',
      );
    });

    it('should log exists() operation with LOG start and LOG end', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Alice' });
      consoleLogSpy.mockClear();

      const result = testSchema.users.exists();

      expect(result).toBe(true);

      // BaseCollection LOG start
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Checking existence in 'users'`,
        expect.objectContaining({
          where: undefined,
        }),
      );

      // BaseCollection LOG end
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Existence check in 'users': true`,
        '',
      );
    });

    it('should log exists() operation with where clause', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Alice' });
      consoleLogSpy.mockClear();

      const resultExists = testSchema.users.exists({ name: 'Alice' });
      expect(resultExists).toBe(true);

      consoleLogSpy.mockClear();

      const resultNotExists = testSchema.users.exists({ name: 'Charlie' });
      expect(resultNotExists).toBe(false);

      // BaseCollection LOG start with where clause
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Checking existence in 'users'`,
        expect.objectContaining({
          where: { name: 'Charlie' },
        }),
      );

      // BaseCollection LOG end (false result)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Existence check in 'users': false`,
        '',
      );
    });

    it('should log delete operation with LOG start and LOG end', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      const user = testSchema.users.create({ name: 'Alice' });
      consoleLogSpy.mockClear();

      testSchema.users.delete(user.id);

      // BaseCollection LOG start
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Deleting model ${user.id} from 'users'`,
        '',
      );

      // DbCollection DEBUG internal
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('DEBUG')}: Deleted record from 'users'`,
        expect.objectContaining({
          id: user.id,
        }),
      );

      // BaseCollection LOG end
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Deleted model ${user.id} from 'users'`,
        '',
      );
    });

    it('should log deleteMany operation with LOG start and LOG end', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Alice' });
      testSchema.users.create({ name: 'Bob' });
      consoleLogSpy.mockClear();

      const count = testSchema.users.deleteMany({ name: 'Alice' });

      // BaseCollection LOG start
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Deleting models from 'users'`,
        expect.objectContaining({
          input: { name: 'Alice' },
        }),
      );

      // DbCollection DEBUG internal
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('DEBUG')}: 1 records deleted from 'users'`,
        expect.objectContaining({
          ids: expect.any(Array),
        }),
      );

      // BaseCollection LOG end
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Deleted 1 models from 'users'`,
        '',
      );

      expect(count).toBe(1);
    });
  });

  describe('Fixtures logging', () => {
    it('should log fixture loading with LOG start and INFO end', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'log' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([
              { id: '1', name: 'Alice' },
              { id: '2', name: 'Bob' },
            ])
            .build(),
        })
        .build();

      // Clear previous logs from schema initialization
      consoleLogSpy.mockClear();

      await testSchema.users.loadFixtures();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Loading fixtures for 'users'`,
        expect.objectContaining({ count: 2 }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('INFO')}: Fixtures loaded for 'users'`,
        expect.objectContaining({ count: 2 }),
      );
    });

    it('should log fixture conflicts at error level', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'error' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([
              { id: '1', name: 'Alice' },
              { id: '2', name: 'Bob' },
            ])
            .build(),
        })
        .build();

      // Load fixtures first time
      await testSchema.users.loadFixtures();

      // Try to load again - should conflict
      try {
        await testSchema.users.loadFixtures();
      } catch (_error) {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('ERROR')}: Fixture loading failed: ID conflicts detected`,
        expect.objectContaining({
          collection: 'users',
          conflicts: ['1', '2'],
        }),
      );
    });

    it('should log auto-loading fixtures', () => {
      schema()
        .logging({ enabled: true, level: 'log' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([{ id: '1', name: 'Alice' }], { strategy: 'auto' })
            .build(),
        })
        .build();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Auto-loading fixtures`,
        expect.objectContaining({
          collections: ['users'],
        }),
      );
    });
  });

  describe('Seeds logging', () => {
    it('should log seed loading with LOG start and INFO end', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'log' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .seeds((schema) => {
              schema.users.create({ name: 'Seeded User' });
            })
            .build(),
        })
        .build();

      // Clear previous logs from schema initialization
      consoleLogSpy.mockClear();

      await testSchema.users.loadSeeds();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Loading seeds for 'users'`,
        expect.objectContaining({
          scenarios: ['default'],
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('INFO')}: Seeds loaded for 'users'`,
        '',
      );
    });

    it('should log seed scenario loading with LOG start and INFO end', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'log' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .seeds({
              development: (schema) => {
                schema.users.create({ name: 'Dev User' });
              },
              testing: (schema) => {
                schema.users.create({ name: 'Test User' });
              },
            })
            .build(),
        })
        .build();

      // Clear previous logs
      consoleLogSpy.mockClear();

      await testSchema.users.loadSeeds('development');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Loading seed scenario 'development' for 'users'`,
        '',
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('INFO')}: Seed scenario 'development' loaded for 'users'`,
        '',
      );
    });

    it('should log seed scenario not found at error level', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'error' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .seeds({
              development: (schema) => {
                schema.users.create({ name: 'Dev User' });
              },
            })
            .build(),
        })
        .build();

      try {
        await testSchema.users.loadSeeds('nonexistent');
      } catch (_error) {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('ERROR')}: Seed scenario 'nonexistent' not found`,
        expect.objectContaining({
          collection: 'users',
          requested: 'nonexistent',
          available: ['development'],
        }),
      );
    });
  });

  describe('Schema-level operations', () => {
    it('should log schema.loadSeeds with LOG start and INFO end', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'log' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .seeds((schema) => {
              schema.users.create({ name: 'User' });
            })
            .build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .seeds((schema) => {
              schema.posts.create({ title: 'Post' });
            })
            .build(),
        })
        .build();

      // Clear previous logs
      consoleLogSpy.mockClear();

      await testSchema.loadSeeds();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Loading all seeds`,
        expect.objectContaining({
          collections: ['users', 'posts'],
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('INFO')}: All seeds loaded`,
        expect.objectContaining({
          users: expect.any(Array),
          posts: expect.any(Array),
        }),
      );
    });

    it('should log schema.loadFixtures with LOG start and INFO end', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'log' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([{ id: '1', name: 'Alice' }])
            .build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .fixtures([{ id: '1', title: 'Post 1' }])
            .build(),
        })
        .build();

      // Clear previous logs
      consoleLogSpy.mockClear();

      await testSchema.loadFixtures();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Loading all fixtures`,
        expect.objectContaining({
          collections: ['users', 'posts'],
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('INFO')}: All fixtures loaded`,
        expect.objectContaining({
          users: expect.any(Array),
          posts: expect.any(Array),
        }),
      );
    });
  });

  describe('Different log levels', () => {
    it('should respect silent log level', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'silent' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Alice' });

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should only log errors at error level', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'error' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .fixtures([{ id: '1', name: 'Alice' }])
            .build(),
        })
        .build();

      // This shouldn't log anything (info level)
      await testSchema.users.loadFixtures();

      // Clear and try to load again (should log error)
      consoleLogSpy.mockClear();
      consoleErrorSpy.mockClear();

      try {
        await testSchema.users.loadFixtures();
      } catch (_error) {
        // Expected to throw
      }

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should show LOG level messages when level is set to log', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'log' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Alice' });
      consoleLogSpy.mockClear();

      testSchema.users.find('1');

      // Should see LOG level messages (LOG = 1)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Finding model in 'users'`,
        expect.anything(),
      );

      // Should see LOG level end messages
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Found 1 model in 'users'`,
        expect.anything(),
      );

      // Should NOT see DEBUG level messages (DEBUG = 0, filtered out at LOG level)
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(`${coloredLevel('DEBUG')}`),
        expect.anything(),
      );
    });
  });

  describe('Custom prefix', () => {
    it('should use custom prefix', () => {
      schema()
        .logging({ enabled: true, level: 'info', prefix: '[MyORM]' })
        .collections({
          users: collection<TestSchema>().model(userModel).build(),
        })
        .build();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[MyORM] ${coloredLevel('INFO')}: All collections registered`,
        expect.anything(),
      );
    });
  });

  describe('New LOG level', () => {
    it('should support log level as string config', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'log' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Alice' });
      consoleLogSpy.mockClear();

      testSchema.users.all();

      // LOG level start message should appear
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: Fetching all models from 'users'`,
        '',
      );
    });
  });
});
