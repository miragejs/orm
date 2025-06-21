import { DB, DbCollection, IdentityManager } from '@src/db';
import { MirageError } from '@src/utils';

describe('DB', () => {
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const db = DB.setup();
      expect(db).toBeDefined();
    });

    it('should initialize the default application identity manager', () => {
      const db = DB.setup();
      expect(db.identityManagerFor('application')).toBeInstanceOf(IdentityManager);
    });

    it('should initialize with initial data', () => {
      const initialData = {
        users: [{ id: '1', name: 'John' }],
        posts: [{ id: '1', title: 'Post 1' }],
      };
      const db = DB.setup<{
        users: DbCollection<{ name: string }>;
        posts: DbCollection<{ title: string }>;
      }>({ initialData });

      expect(db.users.find('1')).toEqual({ id: '1', name: 'John' });
      expect(db.posts.find('1')).toEqual({ id: '1', title: 'Post 1' });
    });
  });

  describe('collection accessors', () => {
    it('should provide access to collections via property accessors', () => {
      const db = DB.setup<{
        users: DbCollection<{ name: string }>;
        posts: DbCollection<{ title: string }>;
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
      const db = DB.setup();
      db.createCollection('users');
      expect(db.users).toBeDefined();
      expect(db.posts).toBeUndefined();
    });
  });

  describe('identityManagerFor', () => {
    it('should return collection-specific identity manager', () => {
      const usersManager = new IdentityManager();
      const db = DB.setup({
        identityManagers: new Map([['users', usersManager]]),
      });
      expect(db.identityManagerFor('users')).toBe(usersManager);
    });

    it('should return application identity manager as fallback', () => {
      const appManager = new IdentityManager();
      const db = DB.setup({
        identityManagers: new Map([['application', appManager]]),
      });
      expect(db.identityManagerFor('unknown')).toBe(appManager);
    });

    it('should create new identity manager if no fallback exists', () => {
      const db = DB.setup();
      const manager = db.identityManagerFor('unknown');
      expect(manager).toBeInstanceOf(IdentityManager);
    });
  });

  describe('createCollection', () => {
    it('should create a new collection', () => {
      const db = DB.setup().createCollection('users');
      expect(db.users).toBeDefined();
      expect(db.users.name).toBe('users');
    });

    it('should create collection with initial data', () => {
      const initialData = [{ name: 'John' }];
      const db = DB.setup().createCollection('users', initialData);
      expect(db.users.find('1')).toEqual({ id: '1', name: 'John' });
    });

    it('should throw error when creating duplicate collection', () => {
      const db = DB.setup().createCollection('users');
      expect(() => db.createCollection('users')).toThrow('Collection users already exists');
    });
  });

  describe('getCollection', () => {
    it('should return existing collection', () => {
      const db = DB.setup().createCollection('users');
      const retrieved = db.getCollection('users');
      expect(retrieved).toBe(db.users);
    });

    it('should throw error for non-existent collection', () => {
      const db = DB.setup();
      expect(() => db.getCollection('users')).toThrow(MirageError);
    });
  });

  describe('loadData', () => {
    it('should create collections and load data', () => {
      const data = {
        users: [{ id: '1', name: 'John' }],
        posts: [{ id: '1', title: 'Post 1' }],
      };
      const db = DB.setup().loadData(data);
      expect(db.users.find('1')).toEqual({ id: '1', name: 'John' });
      expect(db.posts.find('1')).toEqual({ id: '1', title: 'Post 1' });
    });

    it('should handle empty data', () => {
      const db = DB.setup();
      db.loadData({});
      expect(db.dump()).toEqual({});
    });
  });

  describe('emptyData', () => {
    it('should clear all collections', () => {
      const db = DB.setup({
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
      const db = DB.setup();
      expect(() => db.emptyData()).not.toThrow();
    });
  });

  describe('dump', () => {
    it('should return all collection data', () => {
      const db = DB.setup({
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
      const db = DB.setup();
      expect(db.dump()).toEqual({});
    });

    it('should return updated data after modifications', () => {
      const db = DB.setup({
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
