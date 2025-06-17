import { DB, IdentityManager } from '@src/db';
import { MirageError } from '@src/utils';

describe('DB', () => {
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const db = DB.create();
      expect(db).toBeDefined();
    });

    it('should initialize the default application identity manager', () => {
      const db = DB.create();
      expect(db.identityManagerFor('application')).toBeInstanceOf(IdentityManager);
    });

    it('should initialize with initial data', () => {
      const initialData = {
        users: [{ id: 1, name: 'John' }],
        posts: [{ id: 1, title: 'Post 1' }],
      };
      const db = DB.create({ initialData });
      expect(db.users.find(1)).toEqual({ id: 1, name: 'John' });
      expect(db.posts.find(1)).toEqual({ id: 1, title: 'Post 1' });
    });
  });

  describe('collection accessors', () => {
    it('should provide access to collections via property accessors', () => {
      const db = DB.create({
        initialData: {
          users: [{ id: 1, name: 'John' }],
          posts: [{ id: 1, title: 'Post 1' }],
        },
      });

      expect(db.users).toBeDefined();
      expect(db.posts).toBeDefined();
      expect(db.users.find(1)).toEqual({ id: 1, name: 'John' });
      expect(db.posts.find(1)).toEqual({ id: 1, title: 'Post 1' });
    });

    it('should update accessors when collections change', () => {
      const db = DB.create();
      db.createCollection('users');
      expect(db.users).toBeDefined();
      expect(db.posts).toBeUndefined();
    });
  });

  describe('identityManagerFor', () => {
    it('should return collection-specific identity manager', () => {
      const usersManager = new IdentityManager();
      const db = DB.create({
        identityManagers: new Map([['users', usersManager]]),
      });
      expect(db.identityManagerFor('users')).toBe(usersManager);
    });

    it('should return application identity manager as fallback', () => {
      const appManager = new IdentityManager();
      const db = DB.create({
        identityManagers: new Map([['application', appManager]]),
      });
      expect(db.identityManagerFor('unknown')).toBe(appManager);
    });

    it('should create new identity manager if no fallback exists', () => {
      const db = DB.create();
      const manager = db.identityManagerFor('unknown');
      expect(manager).toBeInstanceOf(IdentityManager);
    });
  });

  describe('createCollection', () => {
    it('should create a new collection', () => {
      const db = DB.create();
      const collection = db.createCollection('users');
      expect(collection).toBeDefined();
      expect(collection.name).toBe('users');
    });

    it('should create collection with initial data', () => {
      const db = DB.create();
      const initialData = [{ id: 1, name: 'John' }];
      const collection = db.createCollection('users', initialData);
      expect(collection.find(1)).toEqual({ id: 1, name: 'John' });
    });

    it('should throw error when creating duplicate collection', () => {
      const db = DB.create();
      db.createCollection('users');
      expect(() => db.createCollection('users')).toThrow('Collection users already exists');
    });
  });

  describe('getCollection', () => {
    it('should return existing collection', () => {
      const db = DB.create();
      const created = db.createCollection('users');
      const retrieved = db.getCollection('users');
      expect(retrieved).toBe(created);
    });

    it('should throw error for non-existent collection', () => {
      const db = DB.create();
      expect(() => db.getCollection('users')).toThrow(MirageError);
    });
  });

  describe('loadData', () => {
    it('should create collections and load data', () => {
      const db = DB.create();
      const data = {
        users: [{ id: 1, name: 'John' }],
        posts: [{ id: 1, title: 'Post 1' }],
      };
      db.loadData(data);
      expect(db.users.find(1)).toEqual({ id: 1, name: 'John' });
      expect(db.posts.find(1)).toEqual({ id: 1, title: 'Post 1' });
    });

    it('should handle empty data', () => {
      const db = DB.create();
      db.loadData({});
      expect(db.dump()).toEqual({});
    });
  });

  describe('emptyData', () => {
    it('should clear all collections', () => {
      const db = DB.create({
        initialData: {
          users: [{ id: 1, name: 'John' }],
          posts: [{ id: 1, title: 'Post 1' }],
        },
      });
      db.emptyData();
      expect(db.users.size).toBe(0);
      expect(db.posts.size).toBe(0);
    });

    it('should handle empty database', () => {
      const db = DB.create();
      expect(() => db.emptyData()).not.toThrow();
    });
  });

  describe('dump', () => {
    it('should return all collection data', () => {
      const db = DB.create({
        initialData: {
          users: [{ id: 1, name: 'John' }],
          posts: [{ id: 1, title: 'Post 1' }],
        },
      });
      expect(db.dump()).toEqual({
        users: [{ id: 1, name: 'John' }],
        posts: [{ id: 1, title: 'Post 1' }],
      });
    });

    it('should return empty object for empty database', () => {
      const db = DB.create();
      expect(db.dump()).toEqual({});
    });

    it('should return updated data after modifications', () => {
      const db = DB.create({
        initialData: {
          users: [{ id: 1, name: 'John' }],
        },
      });
      db.users.insert({ name: 'Jane' });
      expect(db.dump()).toEqual({
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
      });
    });
  });
});
