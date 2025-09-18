import { factory } from '@src/factory';
import { model, ModelTemplate } from '@src/model';
import { collection, schema, SchemaCollectionConfig } from '@src/schema';

type UserAttrs = {
  id: string;
  name: string;
  email: string;
  role: string;
  processed?: boolean;
};

type PostAttrs = {
  id: string;
  title: string;
  content: string;
  subscription: string;
  userId: string;
};

type TestSchema = {
  users: SchemaCollectionConfig<ModelTemplate<UserAttrs, 'user', 'users'>>;
  posts: SchemaCollectionConfig<ModelTemplate<PostAttrs, 'post', 'posts'>>;
};

const UserModel = model('user', 'users').attrs<UserAttrs>().create();
const PostModel = model('post', 'posts').attrs<PostAttrs>().create();

describe('Factory with Schema', () => {
  it('should execute factory afterCreate hook when creating models through schema', () => {
    const userFactory = factory()
      .model(UserModel)
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
    const userCollection = collection().model(UserModel).factory(userFactory).create();

    const postFactory = factory<TestSchema>()
      .model(PostModel)
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
    const postCollection = collection<TestSchema>().model(PostModel).factory(postFactory).create();

    const testSchema = schema()
      .collections({
        users: userCollection,
        posts: postCollection,
      })
      .build();

    const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
    const post = testSchema.posts.create({ title: 'Test Post', content: 'Test content' });

    expect(user.processed).toBe(true);
    expect(post.userId).toBe(user.id);
  });

  // it('should execute trait afterCreate hooks when creating models with traits', () => {
  //   const hooksCalled: string[] = [];

  //   const userFactory = factory<any, typeof UserModel>(UserModel)
  //     .attrs({ name: 'John', email: 'john@example.com' })
  //     .traits({
  //       admin: {
  //         role: 'admin',
  //         afterCreate: (model, schema) => {
  //           hooksCalled.push('admin');
  //           (model as ProcessedUserAttrs).adminProcessed = true;
  //         },
  //       },
  //       premium: {
  //         role: 'premium',
  //         afterCreate: (model, schema) => {
  //           hooksCalled.push('premium');
  //           (model as ProcessedUserAttrs).premiumProcessed = true;
  //         },
  //       },
  //     })
  //     .create();

  //   const db = new DB({
  //     identityManager: new StringIdentityManager(),
  //   });

  //   const schema = new SchemaBuilder()
  //     .collections({
  //       users: {
  //         model: UserModel,
  //         factory: userFactory,
  //       },
  //     })
  //     .build(db);

  //   const user = schema.users.create('admin');

  //   expect(hooksCalled).toEqual(['admin']);
  //   expect((user as ProcessedUserAttrs).adminProcessed).toBe(true);
  //   expect((user as ProcessedUserAttrs).premiumProcessed).toBeUndefined();
  //   expect(user.role).toBe('admin');
  // });

  // it('should execute multiple trait hooks in order', () => {
  //   const hooksCalled: string[] = [];

  //   const userFactory = factory<any, typeof UserModel>(UserModel)
  //     .attrs({ name: 'John', email: 'john@example.com' })
  //     .traits({
  //       admin: {
  //         role: 'admin',
  //         afterCreate: (model, schema) => {
  //           hooksCalled.push('admin');
  //         },
  //       },
  //       premium: {
  //         role: 'premium',
  //         afterCreate: (model, schema) => {
  //           hooksCalled.push('premium');
  //         },
  //       },
  //     })
  //     .create();

  //   const db = new DB({
  //     identityManager: new StringIdentityManager(),
  //   });

  //   const schema = new SchemaBuilder()
  //     .collections({
  //       users: {
  //         model: UserModel,
  //         factory: userFactory,
  //       },
  //     })
  //     .build(db);

  //   const user = schema.users.create('admin', 'premium');

  //   expect(hooksCalled).toEqual(['admin', 'premium']);
  // });

  // it('should execute factory hook before trait hooks', () => {
  //   const hooksCalled: string[] = [];

  //   const userFactory = factory<any, typeof UserModel>(UserModel)
  //     .attrs({ name: 'John', email: 'john@example.com' })
  //     .traits({
  //       admin: {
  //         role: 'admin',
  //         afterCreate: (model, schema) => {
  //           hooksCalled.push('trait');
  //         },
  //       },
  //     })
  //     .afterCreate((model, schema) => {
  //       hooksCalled.push('factory');
  //     })
  //     .create();

  //   const db = new DB({
  //     identityManager: new StringIdentityManager(),
  //   });

  //   const schema = new SchemaBuilder()
  //     .collections({
  //       users: {
  //         model: UserModel,
  //         factory: userFactory,
  //       },
  //     })
  //     .build(db);

  //   const user = schema.users.create('admin');

  //   expect(hooksCalled).toEqual(['factory', 'trait']);
  // });

  // it('should handle models without hooks gracefully', () => {
  //   const userFactory = factory<any, typeof UserModel>(UserModel)
  //     .attrs({ name: 'John', email: 'john@example.com', role: 'user' })
  //     .create();

  //   const db = new DB({
  //     identityManager: new StringIdentityManager(),
  //   });

  //   const schema = new SchemaBuilder()
  //     .collections({
  //       users: {
  //         model: UserModel,
  //         factory: userFactory,
  //       },
  //     })
  //     .build(db);

  //   const user = schema.users.create();

  //   expect(user.name).toBe('John');
  //   expect(user.email).toBe('john@example.com');
  //   expect(user.role).toBe('user');
  // });

  // it('should ignore non-string arguments when processing traits', () => {
  //   const hooksCalled: string[] = [];

  //   const userFactory = factory<any, typeof UserModel>(UserModel)
  //     .attrs({ name: 'John', email: 'john@example.com' })
  //     .traits({
  //       admin: {
  //         role: 'admin',
  //         afterCreate: (model, schema) => {
  //           hooksCalled.push('admin');
  //         },
  //       },
  //     })
  //     .create();

  //   const db = new DB({
  //     identityManager: new StringIdentityManager(),
  //   });

  //   const schema = new SchemaBuilder()
  //     .collections({
  //       users: {
  //         model: UserModel,
  //         factory: userFactory,
  //       },
  //     })
  //     .build(db);

  //   const user = schema.users.create('admin', { age: 30 });

  //   expect(hooksCalled).toEqual(['admin']);
  //   expect(user.role).toBe('admin');
  // });

  // it('should work with multiple collections and cross-collection references', () => {
  //   const userHooks: string[] = [];
  //   const postHooks: string[] = [];

  //   const userFactory = factory<any, typeof UserModel>(UserModel)
  //     .attrs({ name: 'John', email: 'john@example.com' })
  //     .afterCreate((model, schema) => {
  //       userHooks.push('user-created');
  //     })
  //     .create();

  //   const postFactory = factory<any, typeof PostModel>(PostModel)
  //     .attrs({ title: 'Test Post', content: 'Test content' })
  //     .afterCreate((model, schema) => {
  //       postHooks.push('post-created');
  //       // Access other collections through schema
  //       const users = schema.users.all();
  //       if (users.length > 0) {
  //         model.userId = users.first()?.id || '';
  //       }
  //     })
  //     .create();

  //   const db = new DB({
  //     identityManager: new StringIdentityManager(),
  //   });

  //   const schema = new SchemaBuilder()
  //     .collections({
  //       users: {
  //         model: UserModel,
  //         factory: userFactory,
  //       },
  //       posts: {
  //         model: PostModel,
  //         factory: postFactory,
  //       },
  //     })
  //     .build(db);

  //   const user = schema.users.create();
  //   const post = schema.posts.create();

  //   expect(userHooks).toEqual(['user-created']);
  //   expect(postHooks).toEqual(['post-created']);
  //   expect(post.userId).toBe(user.id);
  // });
});
