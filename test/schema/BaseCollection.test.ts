import { associations } from '@src/associations';
import { model } from '@src/model';
import { collection, schema } from '@src/schema';

// Define test model attributes
interface UserAttrs {
  id: string;
  name: string;
  email: string;
  age?: number;
  status?: string;
  postIds?: string[];
}

interface PostAttrs {
  id: string;
  title: string;
  authorId: string | null;
}

// Create test models
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();

// Create test schema with collections
const testSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .relationships({
        posts: associations.hasMany(postModel),
      })
      .create(),
    posts: collection()
      .model(postModel)
      .relationships({
        author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
      })
      .create(),
  })
  .setup();

describe('BaseCollection', () => {
  describe('Records accessor', () => {
    it('should return model at specific index', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', postIds: [] },
      ]);

      const firstUser = testSchema.users.at(0);
      const secondUser = testSchema.users.at(1);

      expect(firstUser?.attrs.name).toBe('John');
      expect(secondUser?.attrs.name).toBe('Jane');

      // Cleanup
      testSchema.db.getCollection('users').clear();
    });

    it('should return undefined for invalid index', () => {
      expect(testSchema.users.at(99)).toBeUndefined();
      expect(testSchema.users.at(-1)).toBeUndefined();
    });

    it('should return first model', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', postIds: [] },
      ]);

      const firstUser = testSchema.users.first();
      expect(firstUser?.attrs.name).toBe('John');

      // Cleanup
      testSchema.db.getCollection('users').clear();
    });

    it('should return null when calling first() on empty collection', () => {
      expect(testSchema.users.first()).toBeNull();
    });

    it('should return last model', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', postIds: [] },
      ]);

      const lastUser = testSchema.users.last();
      expect(lastUser?.attrs.name).toBe('Jane');

      // Cleanup
      testSchema.db.getCollection('users').clear();
    });

    it('should return null when calling last() on empty collection', () => {
      expect(testSchema.users.last()).toBeNull();
    });

    it('should return all models', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', postIds: [] },
        { id: '3', name: 'Bob', email: 'bob@example.com', postIds: [] },
      ]);

      const allUsers = testSchema.users.all();
      expect(allUsers.length).toBe(3);
      expect(allUsers.models[0].attrs.name).toBe('John');
      expect(allUsers.models[1].attrs.name).toBe('Jane');
      expect(allUsers.models[2].attrs.name).toBe('Bob');

      // Cleanup
      testSchema.db.getCollection('users').clear();
    });
  });

  describe('DB integration', () => {
    it('should read records from database', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insert({ id: '1', name: 'John', email: 'john@example.com', postIds: [] });

      const user = testSchema.users.find('1');
      expect(user).toBeDefined();
      expect(user?.attrs.name).toBe('John');

      // Cleanup
      usersCollection.clear();
    });

    it('should delete records from database', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insert({ id: '1', name: 'John', email: 'john@example.com', postIds: [] });

      expect(testSchema.users.find('1')).not.toBeNull();

      usersCollection.delete('1');

      expect(testSchema.users.find('1')).toBeNull();
    });

    it('should work with relationships', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insert({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        postIds: ['p1', 'p2'],
      });

      const postsCollection = testSchema.db.getCollection('posts');
      postsCollection.insertMany([
        { id: 'p1', title: 'Post 1', authorId: '1' },
        { id: 'p2', title: 'Post 2', authorId: '1' },
      ]);

      const user = testSchema.users.find('1');
      expect(user).toBeDefined();
      expect(user?.attrs.postIds).toEqual(['p1', 'p2']);

      const post = testSchema.posts.find('p1');
      expect(post?.attrs.authorId).toBe('1');

      // Cleanup
      testSchema.db.emptyData();
    });
  });

  describe('find()', () => {
    it('should find by ID', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insert({ id: '1', name: 'John', email: 'john@example.com', postIds: [] });

      const user = testSchema.users.find('1');
      expect(user?.attrs.id).toBe('1');
      expect(user?.attrs.name).toBe('John');

      // Cleanup
      usersCollection.clear();
    });

    it('should find by predicate object', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', postIds: [] },
      ]);

      const user = testSchema.users.find({ email: 'jane@example.com' });
      expect(user?.attrs.name).toBe('Jane');

      // Cleanup
      usersCollection.clear();
    });

    it('should find with query options (predicate object)', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', age: 25, postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', age: 30, postIds: [] },
        { id: '3', name: 'Bob', email: 'bob@example.com', age: 35, postIds: [] },
      ]);

      const user = testSchema.users.find({
        where: { age: 30 },
      });
      expect(user?.attrs.name).toBe('Jane');

      // Cleanup
      usersCollection.clear();
    });

    it('should find with query options (field operators)', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', age: 25, postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', age: 30, postIds: [] },
        { id: '3', name: 'Bob', email: 'bob@example.com', age: 35, postIds: [] },
      ]);

      const user = testSchema.users.find({
        where: { age: { gte: 30 } },
        orderBy: { age: 'asc' },
      });
      expect(user?.attrs.name).toBe('Jane');
      expect(user?.attrs.age).toBe(30);

      // Cleanup
      usersCollection.clear();
    });

    it('should find with callback where clause using model', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        {
          id: '1',
          name: 'John',
          email: 'john@example.com',
          age: 25,
          status: 'active',
          postIds: [],
        },
        {
          id: '2',
          name: 'Jane',
          email: 'jane@example.com',
          age: 30,
          status: 'inactive',
          postIds: [],
        },
        { id: '3', name: 'Bob', email: 'bob@example.com', age: 35, status: 'active', postIds: [] },
      ]);

      const user = testSchema.users.find({
        where: (model: any) => (model.attrs.age ?? 0) >= 30 && model.attrs.status === 'active',
      });

      expect(user?.attrs.name).toBe('Bob');
      expect(user?.attrs.age).toBe(35);
      expect(user?.attrs.status).toBe('active');

      // Cleanup
      usersCollection.clear();
    });

    it('should find with callback where clause using helpers', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', age: 25, postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', age: 30, postIds: [] },
        { id: '3', name: 'Bob', email: 'bob@example.com', age: 35, postIds: [] },
      ]);

      const user = testSchema.users.find({
        where: (model: any, { gte }) => gte(model.attrs.age ?? 0, 30),
        orderBy: { age: 'asc' },
      });

      expect(user?.attrs.name).toBe('Jane');

      // Cleanup
      usersCollection.clear();
    });

    it('should return null when no match found', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insert({ id: '1', name: 'John', email: 'john@example.com', postIds: [] });

      expect(testSchema.users.find('999')).toBeNull();
      expect(testSchema.users.find({ name: 'NonExistent' })).toBeNull();

      // Cleanup
      usersCollection.clear();
    });
  });

  describe('findMany()', () => {
    it('should find by IDs', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', postIds: [] },
        { id: '3', name: 'Bob', email: 'bob@example.com', postIds: [] },
      ]);

      const users = testSchema.users.findMany(['1', '3']);
      expect(users.length).toBe(2);
      expect(users.models[0].attrs.name).toBe('John');
      expect(users.models[1].attrs.name).toBe('Bob');

      // Cleanup
      usersCollection.clear();
    });

    it('should find by predicate object', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', status: 'active', postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', status: 'active', postIds: [] },
        { id: '3', name: 'Bob', email: 'bob@example.com', status: 'inactive', postIds: [] },
      ]);

      const users = testSchema.users.findMany({ status: 'active' });
      expect(users.length).toBe(2);
      expect(users.models[0].attrs.name).toBe('John');
      expect(users.models[1].attrs.name).toBe('Jane');

      // Cleanup
      usersCollection.clear();
    });

    it('should find with query options and ordering', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', age: 25, postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', age: 30, postIds: [] },
        { id: '3', name: 'Bob', email: 'bob@example.com', age: 35, postIds: [] },
      ]);

      const users = testSchema.users.findMany({
        where: { age: { gte: 25 } },
        orderBy: { age: 'desc' },
        limit: 2,
      });

      expect(users.length).toBe(2);
      expect(users.models[0].attrs.name).toBe('Bob');
      expect(users.models[1].attrs.name).toBe('Jane');

      // Cleanup
      usersCollection.clear();
    });

    it('should find with callback where clause', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        {
          id: '1',
          name: 'John',
          email: 'john@example.com',
          age: 25,
          status: 'active',
          postIds: [],
        },
        {
          id: '2',
          name: 'Jane',
          email: 'jane@example.com',
          age: 30,
          status: 'active',
          postIds: [],
        },
        {
          id: '3',
          name: 'Bob',
          email: 'bob@example.com',
          age: 35,
          status: 'inactive',
          postIds: [],
        },
      ]);

      const users = testSchema.users.findMany({
        where: (model: any) => (model.attrs.age ?? 0) >= 25 && model.attrs.status === 'active',
      });
      expect(users.length).toBe(2);
      expect(users.models[0].attrs.name).toBe('John');
      expect(users.models[1].attrs.name).toBe('Jane');

      // Cleanup
      usersCollection.clear();
    });

    it('should find with callback where clause and helpers', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        {
          id: '1',
          name: 'John',
          email: 'john@example.com',
          age: 25,
          status: 'active',
          postIds: [],
        },
        {
          id: '2',
          name: 'Jane',
          email: 'jane@example.com',
          age: 30,
          status: 'active',
          postIds: [],
        },
        {
          id: '3',
          name: 'Bob',
          email: 'bob@example.com',
          age: 35,
          status: 'inactive',
          postIds: [],
        },
      ]);

      const users = testSchema.users.findMany({
        where: (model: any, { and, gte, lte }) =>
          and(gte(model.attrs.age ?? 0, 25), lte(model.attrs.age ?? 0, 30)),
        orderBy: { age: 'asc' },
      });

      expect(users.length).toBe(2);
      expect(users.models[0].attrs.name).toBe('John');
      expect(users.models[1].attrs.name).toBe('Jane');

      // Cleanup
      usersCollection.clear();
    });

    it('should return empty collection when no matches found', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insert({ id: '1', name: 'John', email: 'john@example.com', postIds: [] });

      const users = testSchema.users.findMany({ name: 'NonExistent' });
      expect(users.length).toBe(0);
      expect(users.models).toEqual([]);

      // Cleanup
      usersCollection.clear();
    });
  });

  describe('deleteMany()', () => {
    it('should delete by IDs', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', postIds: [] },
        { id: '3', name: 'Bob', email: 'bob@example.com', postIds: [] },
      ]);

      const deletedCount = testSchema.users.deleteMany(['1', '3']);
      expect(deletedCount).toBe(2);
      expect(testSchema.users.all().length).toBe(1);
      expect(testSchema.users.find('2')?.attrs.name).toBe('Jane');

      // Cleanup
      testSchema.db.getCollection('users').delete('2');
    });

    it('should delete by predicate object', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', status: 'inactive', postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', status: 'active', postIds: [] },
        { id: '3', name: 'Bob', email: 'bob@example.com', status: 'inactive', postIds: [] },
      ]);

      const deletedCount = testSchema.users.deleteMany({ status: 'inactive' });
      expect(deletedCount).toBe(2);
      expect(testSchema.users.all().length).toBe(1);
      expect(testSchema.users.find('2')?.attrs.name).toBe('Jane');

      // Cleanup
      usersCollection.clear();
    });

    it('should delete with query options', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        { id: '1', name: 'John', email: 'john@example.com', age: 25, postIds: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', age: 30, postIds: [] },
        { id: '3', name: 'Bob', email: 'bob@example.com', age: 35, postIds: [] },
      ]);

      const deletedCount = testSchema.users.deleteMany({
        where: { age: { gte: 30 } },
      });
      expect(deletedCount).toBe(2);
      expect(testSchema.users.all().length).toBe(1);
      expect(testSchema.users.find('1')?.attrs.name).toBe('John');

      // Cleanup
      usersCollection.clear();
    });

    it('should delete with callback where clause', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insertMany([
        {
          id: '1',
          name: 'John',
          email: 'john@example.com',
          age: 25,
          status: 'active',
          postIds: [],
        },
        {
          id: '2',
          name: 'Jane',
          email: 'jane@example.com',
          age: 30,
          status: 'active',
          postIds: [],
        },
        {
          id: '3',
          name: 'Bob',
          email: 'bob@example.com',
          age: 35,
          status: 'inactive',
          postIds: [],
        },
      ]);

      const deletedCount = testSchema.users.deleteMany({
        where: (model: any) => (model.attrs.age ?? 0) < 30 || model.attrs.status === 'inactive',
      });
      expect(deletedCount).toBe(2);
      expect(testSchema.users.all().length).toBe(1);
      expect(testSchema.users.find('2')?.attrs.name).toBe('Jane');

      // Cleanup
      usersCollection.clear();
    });

    it('should return 0 when no matches found', () => {
      const usersCollection = testSchema.db.getCollection('users');
      usersCollection.insert({ id: '1', name: 'John', email: 'john@example.com', postIds: [] });

      const deletedCount = testSchema.users.deleteMany({ name: 'NonExistent' });
      expect(deletedCount).toBe(0);
      expect(testSchema.users.all().length).toBe(1);

      // Cleanup
      usersCollection.clear();
    });
  });
});
