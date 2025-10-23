import { factory } from '@src/factory';
import { model } from '@src/model';
import { collection, schema, type CollectionConfig } from '@src/schema';

// Define test model attributes
interface UserAttrs {
  id: string;
  name: string;
  email: string;
  role: string;
  processed?: boolean;
}

interface PostAttrs {
  id: string;
  title: string;
  content: string;
  subscription: string;
  userId: string;
}

// Create test models
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();

// Define test schema type
type TestSchema = {
  users: CollectionConfig<typeof userModel>;
  posts: CollectionConfig<typeof postModel>;
};

describe('Factory with Schema', () => {
  it('should execute factory afterCreate hook when creating models through schema', () => {
    const userFactory = factory()
      .model(userModel)
      .attrs({
        name: 'John',
        email: 'john@example.com',
      })
      .traits({
        admin: { role: 'admin' },
      })
      .afterCreate((user) => {
        user.processed = true;
      })
      .create();
    const userCollection = collection().model(userModel).factory(userFactory).create();

    const postFactory = factory<TestSchema>()
      .model(postModel)
      .attrs({
        title: 'Test Post',
        content: 'Test content',
        subscription: 'free',
      })
      .traits({
        premium: { subscription: 'premium' },
      })
      .afterCreate((model, schema) => {
        const user = schema.users.first()!;
        model.userId = user.id;
      })
      .create();
    const postCollection = collection<TestSchema>().model(postModel).factory(postFactory).create();

    const testSchema = schema()
      .collections({
        users: userCollection,
        posts: postCollection,
      })
      .setup();

    const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
    const post = testSchema.posts.create({ title: 'Test Post', content: 'Test content' });

    expect(user.processed).toBe(true);
    expect(post.userId).toBe(user.id);
  });

  it('should execute trait afterCreate hooks when creating models with traits', () => {
    const hooksCalled: string[] = [];

    const userFactory = factory()
      .model(userModel)
      .attrs({
        name: 'John',
        email: 'john@example.com',
      })
      .traits({
        admin: {
          role: 'admin',
          afterCreate: (model) => {
            hooksCalled.push('admin');
            (model as any).adminProcessed = true;
          },
        },
        premium: {
          role: 'premium',
          afterCreate: (model) => {
            hooksCalled.push('premium');
            (model as any).premiumProcessed = true;
          },
        },
      })
      .create();

    const userCollection = collection().model(userModel).factory(userFactory).create();

    const testSchema = schema()
      .collections({
        users: userCollection,
      })
      .setup();

    const user = testSchema.users.create('admin');

    expect(hooksCalled).toEqual(['admin']);
    expect((user as any).adminProcessed).toBe(true);
    expect((user as any).premiumProcessed).toBeUndefined();
    expect(user.role).toBe('admin');
  });

  it('should execute multiple trait hooks in order', () => {
    const hooksCalled: string[] = [];

    const userFactory = factory()
      .model(userModel)
      .attrs({
        name: 'John',
        email: 'john@example.com',
      })
      .traits({
        admin: {
          role: 'admin',
          afterCreate: () => {
            hooksCalled.push('admin');
          },
        },
        premium: {
          role: 'premium',
          afterCreate: () => {
            hooksCalled.push('premium');
          },
        },
      })
      .create();

    const userCollection = collection().model(userModel).factory(userFactory).create();

    const testSchema = schema()
      .collections({
        users: userCollection,
      })
      .setup();

    const user = testSchema.users.create('admin', 'premium');

    expect(hooksCalled).toEqual(['admin', 'premium']);
  });

  it('should execute factory hook before trait hooks', () => {
    const hooksCalled: string[] = [];

    const userFactory = factory()
      .model(userModel)
      .attrs({
        name: 'John',
        email: 'john@example.com',
      })
      .traits({
        admin: {
          role: 'admin',
          afterCreate: () => {
            hooksCalled.push('trait');
          },
        },
      })
      .afterCreate(() => {
        hooksCalled.push('factory');
      })
      .create();

    const userCollection = collection().model(userModel).factory(userFactory).create();

    const testSchema = schema()
      .collections({
        users: userCollection,
      })
      .setup();

    const user = testSchema.users.create('admin');

    expect(hooksCalled).toEqual(['factory', 'trait']);
  });

  it('should handle models without hooks gracefully', () => {
    const userFactory = factory()
      .model(userModel)
      .attrs({
        name: 'John',
        email: 'john@example.com',
        role: 'user',
      })
      .create();

    const userCollection = collection().model(userModel).factory(userFactory).create();

    const testSchema = schema()
      .collections({
        users: userCollection,
      })
      .setup();

    const user = testSchema.users.create();

    expect(user.name).toBe('John');
    expect(user.email).toBe('john@example.com');
    expect(user.role).toBe('user');
  });

  it('should ignore non-string arguments when processing traits', () => {
    const hooksCalled: string[] = [];

    const userFactory = factory()
      .model(userModel)
      .attrs({
        name: 'John',
        email: 'john@example.com',
      })
      .traits({
        admin: {
          role: 'admin',
          afterCreate: () => {
            hooksCalled.push('admin');
          },
        },
      })
      .create();

    const userCollection = collection().model(userModel).factory(userFactory).create();

    const testSchema = schema()
      .collections({
        users: userCollection,
      })
      .setup();

    const user = testSchema.users.create('admin', { age: 30 } as any);

    expect(hooksCalled).toEqual(['admin']);
    expect(user.role).toBe('admin');
  });

  it('should work with multiple collections and cross-collection references', () => {
    const userHooks: string[] = [];
    const postHooks: string[] = [];

    const userFactory = factory()
      .model(userModel)
      .attrs({
        name: 'John',
        email: 'john@example.com',
      })
      .afterCreate(() => {
        userHooks.push('user-created');
      })
      .create();

    const postFactory = factory<TestSchema>()
      .model(postModel)
      .attrs({
        title: 'Test Post',
        content: 'Test content',
        subscription: 'free',
      })
      .afterCreate((model, schema) => {
        postHooks.push('post-created');
        // Access other collections through schema
        const users = schema.users.all();
        if (users.length > 0) {
          model.userId = users.first()?.id || '';
        }
      })
      .create();

    const userCollection = collection().model(userModel).factory(userFactory).create();
    const postCollection = collection<TestSchema>().model(postModel).factory(postFactory).create();

    const testSchema = schema()
      .collections({
        users: userCollection,
        posts: postCollection,
      })
      .setup();

    const user = testSchema.users.create();
    const post = testSchema.posts.create();

    expect(userHooks).toEqual(['user-created']);
    expect(postHooks).toEqual(['post-created']);
    expect(post.userId).toBe(user.id);
  });
});
