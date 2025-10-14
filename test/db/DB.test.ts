import { createDatabase, DbCollection } from '@src/db';
import { IdentityManager } from '@src/id-manager';
import { MirageError } from '@src/utils';

// Setup test models
interface User {
  id: string;
  name: string;
}

interface Post {
  id: string;
  title: string;
}

describe('DB', () => {
  describe('constructor', () => {
    it('should initialize without errors', () => {
      const db = createDatabase();
      expect(db).toBeDefined();
    });

    it('should initialize with initial data', () => {
      const initialData = {
        users: [{ id: '1', name: 'John' }],
        posts: [{ id: '1', title: 'Post 1' }],
      };
      const db = createDatabase<{
        users: DbCollection<User>;
        posts: DbCollection<Post>;
      }>({ initialData });

      expect(db.users.find('1')).toEqual({ id: '1', name: 'John' });
      expect(db.posts.find('1')).toEqual({ id: '1', title: 'Post 1' });
    });
  });

  describe('collection accessors', () => {
    it('should provide access to collections via property accessors', () => {
      const db = createDatabase<{
        users: DbCollection<User>;
        posts: DbCollection<Post>;
      }>({
        initialData: {
          users: [{ id: '1', name: 'John' }],
          posts: [{ id: '1', title: 'Post 1' }],
        },
      });

      expect(db.users).toBeDefined();
      expect(db.posts).toBeDefined();
      expect(db.users.find('1')).toEqual({ id: '1', name: 'John' });
      expect(db.posts.find('1')).toEqual({ id: '1', title: 'Post 1' });
    });

    it('should update accessors when collections change', () => {
      const db = createDatabase().createCollection('users');
      expect(db.users).toBeDefined();
      expect(db.posts).toBeUndefined();
    });
  });

  describe('identityManagerFor', () => {
    it('should return collection-specific identity manager', () => {
      const idGenerator = (current: string) => {
        const num = parseInt(current.split('-')[1]);
        return `user-${num + 1}`;
      };
      const usersManager = new IdentityManager<string>({ initialCounter: 'user-1', idGenerator });
      const db = createDatabase().createCollection<{ id: string }>('users', {
        identityManager: usersManager,
      });
      expect(db.identityManagerFor('users')).toBe(usersManager);
    });

    it('should create new identity manager if no fallback exists', () => {
      const db = createDatabase().createCollection<{ id: string }>('users');
      const manager = db.identityManagerFor('users');
      expect(manager).toBeInstanceOf(IdentityManager);
    });
  });

  describe('createCollection', () => {
    it('should create a new collection', () => {
      const db = createDatabase().createCollection('users');
      expect(db.users).toBeDefined();
      expect(db.users.name).toBe('users');
    });

    it('should create collection with initial data', () => {
      const initialData = [{ id: '1', name: 'John' }];
      const db = createDatabase().createCollection<User>('users', { initialData });
      expect(db.users.find('1')).toEqual({ id: '1', name: 'John' });
    });

    it('should throw error when creating duplicate collection', () => {
      const db = createDatabase().createCollection('users');
      expect(() => db.createCollection('users')).toThrow('Collection users already exists');
    });
  });

  describe('getCollection', () => {
    it('should return existing collection', () => {
      const db = createDatabase().createCollection('users');
      const collection = db.getCollection('users');
      expect(collection).toBe(db.users);
    });

    it('should throw error for non-existent collection', () => {
      const db = createDatabase();
      expect(() => db.getCollection('users')).toThrow(MirageError);
    });
  });

  describe('loadData', () => {
    it('should create collections and load data', () => {
      const data = {
        users: [{ id: '1', name: 'John' }],
        posts: [{ id: '1', title: 'Post 1' }],
      };
      const db = createDatabase().loadData(data);
      expect(db.users.find('1')).toEqual({ id: '1', name: 'John' });
      expect(db.posts.find('1')).toEqual({ id: '1', title: 'Post 1' });
    });

    it('should handle empty data', () => {
      const db = createDatabase();
      db.loadData({});
      expect(db.dump()).toEqual({});
    });
  });

  describe('emptyData', () => {
    it('should clear all collections', () => {
      const db = createDatabase({
        initialData: {
          users: [{ id: '1', name: 'John' }],
          posts: [{ id: '1', title: 'Post 1' }],
        },
      });
      db.emptyData();
      expect(db.users.size).toBe(0);
      expect(db.posts.size).toBe(0);
    });

    it('should handle empty database', () => {
      const db = createDatabase();
      expect(() => db.emptyData()).not.toThrow();
    });
  });

  describe('dump', () => {
    it('should return all collection data', () => {
      const db = createDatabase({
        initialData: {
          users: [{ id: '1', name: 'John' }],
          posts: [{ id: '1', title: 'Post 1' }],
        },
      });
      expect(db.dump()).toEqual({
        users: [{ id: '1', name: 'John' }],
        posts: [{ id: '1', title: 'Post 1' }],
      });
    });

    it('should return empty object for empty database', () => {
      const db = createDatabase();
      expect(db.dump()).toEqual({});
    });

    it('should return updated data after modifications', () => {
      const db = createDatabase({
        initialData: {
          users: [{ id: '1', name: 'John' }],
        },
      });
      db.users.insert({ name: 'Jane' });
      expect(db.dump()).toEqual({
        users: [
          { id: '1', name: 'John' },
          { id: '2', name: 'Jane' },
        ],
      });
    });
  });
});
