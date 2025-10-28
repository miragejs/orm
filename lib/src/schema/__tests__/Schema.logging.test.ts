import { factory } from '@src/factory';
import { model } from '@src/model';
import type { Mock } from 'vitest';

import { collection } from '../CollectionBuilder';
import { schema } from '../SchemaBuilder';
import type { CollectionConfig } from '../types';

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
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();

// Create test factories
const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => 'John Doe',
  })
  .create();

const postFactory = factory()
  .model(postModel)
  .attrs({
    title: () => 'Test Post',
  })
  .create();

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
    it('should log schema initialization at debug level', () => {
      schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>().model(userModel).create(),
        })
        .setup();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Mirage] DEBUG: Schema initialized',
        expect.objectContaining({
          collections: ['users'],
        }),
      );
    });

    it('should not log when logging is disabled', () => {
      schema()
        .logging({ enabled: false, level: 'debug' })
        .collections({
          users: collection<TestSchema>().model(userModel).create(),
        })
        .setup();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log when logging is not configured', () => {
      schema()
        .collections({
          users: collection<TestSchema>().model(userModel).create(),
        })
        .setup();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log collection registration', () => {
      schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>().model(userModel).create(),
          posts: collection<TestSchema>().model(postModel).create(),
        })
        .setup();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Mirage] DEBUG: Registering collections',
        expect.objectContaining({
          count: 2,
          names: ['users', 'posts'],
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] DEBUG: Collection 'users' initialized",
        expect.objectContaining({
          modelName: 'user',
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] DEBUG: Collection 'posts' initialized",
        expect.objectContaining({
          modelName: 'post',
        }),
      );
    });
  });

  describe('Collection operations logging', () => {
    it('should log model creation at debug level', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>().model(userModel).factory(userFactory).create(),
        })
        .setup();

      testSchema.users.create({ name: 'Alice' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Mirage] DEBUG: Creating user',
        expect.objectContaining({
          collection: 'users',
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Mirage] DEBUG: Created user with factory',
        expect.objectContaining({
          collection: 'users',
        }),
      );
    });

    it('should not log model creation at info level', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'info' })
        .collections({
          users: collection<TestSchema>().model(userModel).factory(userFactory).create(),
        })
        .setup();

      // Clear previous logs from schema initialization
      consoleLogSpy.mockClear();

      testSchema.users.create({ name: 'Alice' });

      // Should not include debug logs about model creation
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        '[Mirage] DEBUG: Creating user',
        expect.anything(),
      );
    });
  });

  describe('Query operations logging', () => {
    it('should log find operation at debug level', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>().model(userModel).factory(userFactory).create(),
        })
        .setup();

      const user = testSchema.users.create({ name: 'Alice' });
      consoleLogSpy.mockClear();

      testSchema.users.find(user.id);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] DEBUG: Find in 'users'",
        expect.objectContaining({
          query: user.id,
        }),
      );
    });

    it('should log findMany operation at debug level', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>().model(userModel).factory(userFactory).create(),
        })
        .setup();

      testSchema.users.create({ name: 'Alice' });
      testSchema.users.create({ name: 'Bob' });
      consoleLogSpy.mockClear();

      testSchema.users.findMany({ name: 'Alice' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] DEBUG: Query 'users': findMany",
        expect.anything(),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] DEBUG: Query 'users' returned 1 records",
        '',
      );
    });

    it('should log all() operation at debug level', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>().model(userModel).factory(userFactory).create(),
        })
        .setup();

      testSchema.users.create({ name: 'Alice' });
      testSchema.users.create({ name: 'Bob' });
      consoleLogSpy.mockClear();

      testSchema.users.all();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] DEBUG: Query 'users': all()",
        expect.objectContaining({
          operation: 'all',
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] DEBUG: Query 'users' returned 2 records",
        '',
      );
    });

    it('should log first() operation at debug level', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>().model(userModel).factory(userFactory).create(),
        })
        .setup();

      testSchema.users.create({ name: 'Alice' });
      consoleLogSpy.mockClear();

      testSchema.users.first();

      expect(consoleLogSpy).toHaveBeenCalledWith("[Mirage] DEBUG: Query 'users': first()", '');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] DEBUG: Query 'users' found record",
        expect.objectContaining({
          id: expect.anything(),
        }),
      );
    });

    it('should log delete operation at debug level', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>().model(userModel).factory(userFactory).create(),
        })
        .setup();

      const user = testSchema.users.create({ name: 'Alice' });
      consoleLogSpy.mockClear();

      testSchema.users.delete(user.id);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] DEBUG: Delete from 'users'",
        expect.objectContaining({
          id: user.id,
        }),
      );
    });

    it('should log deleteMany operation at debug level', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'debug' })
        .collections({
          users: collection<TestSchema>().model(userModel).factory(userFactory).create(),
        })
        .setup();

      testSchema.users.create({ name: 'Alice' });
      testSchema.users.create({ name: 'Bob' });
      consoleLogSpy.mockClear();

      const count = testSchema.users.deleteMany({ name: 'Alice' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] DEBUG: Delete many from 'users'",
        expect.anything(),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] DEBUG: Deleted 1 records from 'users'",
        '',
      );
      expect(count).toBe(1);
    });
  });

  describe('Fixtures logging', () => {
    it('should log fixture loading at info level', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'info' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([
              { id: '1', name: 'Alice' },
              { id: '2', name: 'Bob' },
            ])
            .create(),
        })
        .setup();

      // Clear previous logs from schema initialization
      consoleLogSpy.mockClear();

      await testSchema.users.loadFixtures();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] INFO: Loading fixtures for collection 'users'",
        expect.objectContaining({ count: 2 }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] INFO: Fixtures loaded successfully for 'users'",
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
            .create(),
        })
        .setup();

      // Load fixtures first time
      await testSchema.users.loadFixtures();

      // Try to load again - should conflict
      try {
        await testSchema.users.loadFixtures();
      } catch (_error) {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Mirage] ERROR: Fixture loading failed: ID conflicts detected',
        expect.objectContaining({
          collection: 'users',
          conflicts: ['1', '2'],
        }),
      );
    });

    it('should log auto-loading fixtures', () => {
      schema()
        .logging({ enabled: true, level: 'info' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([{ id: '1', name: 'Alice' }], { strategy: 'auto' })
            .create(),
        })
        .setup();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Mirage] INFO: Auto-loading fixtures',
        expect.objectContaining({
          collections: ['users'],
        }),
      );
    });
  });

  describe('Seeds logging', () => {
    it('should log seed loading at info level', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'info' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .seeds((schema) => {
              schema.users.create({ name: 'Seeded User' });
            })
            .create(),
        })
        .setup();

      // Clear previous logs from schema initialization
      consoleLogSpy.mockClear();

      await testSchema.users.loadSeeds();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] INFO: Loading all seeds for collection 'users'",
        expect.objectContaining({
          scenarios: ['default'],
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] INFO: Seeds loaded successfully for 'users'",
        '',
      );
    });

    it('should log seed scenario loading', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'info' })
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
            .create(),
        })
        .setup();

      // Clear previous logs
      consoleLogSpy.mockClear();

      await testSchema.users.loadSeeds('development');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] INFO: Loading seed scenario 'development' for 'users'",
        '',
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Mirage] INFO: Seed scenario 'development' loaded successfully",
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
            .create(),
        })
        .setup();

      try {
        await testSchema.users.loadSeeds('nonexistent');
      } catch (_error) {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Mirage] ERROR: Seed scenario 'nonexistent' not found",
        expect.objectContaining({
          collection: 'users',
          requested: 'nonexistent',
          available: ['development'],
        }),
      );
    });
  });

  describe('Schema-level operations', () => {
    it('should log schema.loadSeeds at info level', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'info' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .factory(userFactory)
            .seeds((schema) => {
              schema.users.create({ name: 'User' });
            })
            .create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .seeds((schema) => {
              schema.posts.create({ title: 'Post' });
            })
            .create(),
        })
        .setup();

      // Clear previous logs
      consoleLogSpy.mockClear();

      await testSchema.loadSeeds();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Mirage] INFO: Loading seeds for all collections',
        expect.objectContaining({
          collections: ['users', 'posts'],
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Mirage] INFO: All seeds loaded successfully',
        '',
      );
    });

    it('should log schema.loadFixtures at info level', async () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'info' })
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([{ id: '1', name: 'Alice' }])
            .create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .fixtures([{ id: '1', title: 'Post 1' }])
            .create(),
        })
        .setup();

      // Clear previous logs
      consoleLogSpy.mockClear();

      await testSchema.loadFixtures();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Mirage] INFO: Loading fixtures for all collections',
        expect.objectContaining({
          collections: ['users', 'posts'],
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Mirage] INFO: All fixtures loaded successfully',
        '',
      );
    });
  });

  describe('Different log levels', () => {
    it('should respect silent log level', () => {
      const testSchema = schema()
        .logging({ enabled: true, level: 'silent' })
        .collections({
          users: collection<TestSchema>().model(userModel).factory(userFactory).create(),
        })
        .setup();

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
            .create(),
        })
        .setup();

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
  });

  describe('Custom prefix', () => {
    it('should use custom prefix', () => {
      schema()
        .logging({ enabled: true, level: 'debug', prefix: '[MyORM]' })
        .collections({
          users: collection<TestSchema>().model(userModel).create(),
        })
        .setup();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[MyORM] DEBUG: Schema initialized',
        expect.anything(),
      );
    });
  });
});
