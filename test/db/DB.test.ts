import { DB } from '@src/db';
import { IdentityManager } from '@src/db';
import { MirageError } from '@src/utils';

describe('DB', () => {
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const db = new DB();
      expect(db).toBeDefined();
    });

    it('should initialize with identity managers', () => {
      const identityManagers = {
        users: new IdentityManager(),
        posts: new IdentityManager(),
      };
      const db = new DB({ identityManagers });
      expect(db.identityManagerFor('users')).toBe(identityManagers.users);
      expect(db.identityManagerFor('posts')).toBe(identityManagers.posts);
    });

    it('should initialize with initial data', () => {
      const initialData = {
        users: [{ id: 1, name: 'John' }],
        posts: [{ id: 1, title: 'Post 1' }],
      };
      const db = new DB({ initialData });
      expect(db.getCollection('users').find(1)).toEqual({ id: 1, name: 'John' });
      expect(db.getCollection('posts').find(1)).toEqual({ id: 1, title: 'Post 1' });
    });
  });

  describe('registerIdentityManagers', () => {
    it('should register multiple identity managers', () => {
      const db = new DB();
      const identityManagers = {
        users: new IdentityManager(),
        posts: new IdentityManager(),
      };
      db.registerIdentityManagers(identityManagers);
      expect(db.identityManagerFor('users')).toBe(identityManagers.users);
      expect(db.identityManagerFor('posts')).toBe(identityManagers.posts);
    });
  });

  describe('identityManagerFor', () => {
    it('should return collection-specific identity manager', () => {
      const db = new DB();
      const usersManager = new IdentityManager();
      db.registerIdentityManagers({ users: usersManager });
      expect(db.identityManagerFor('users')).toBe(usersManager);
    });

    it('should return application identity manager as fallback', () => {
      const db = new DB();
      const appManager = new IdentityManager();
      db.registerIdentityManagers({ application: appManager });
      expect(db.identityManagerFor('unknown')).toBe(appManager);
    });

    it('should create new identity manager if no fallback exists', () => {
      const db = new DB();
      const manager = db.identityManagerFor('unknown');
      expect(manager).toBeInstanceOf(IdentityManager);
    });

    it('should handle singularized collection names', () => {
      const db = new DB();
      const usersManager = new IdentityManager();
      db.registerIdentityManagers({ users: usersManager });
      expect(db.identityManagerFor('users')).toBe(usersManager);
    });
  });

  describe('createCollection', () => {
    it('should create a new collection', () => {
      const db = new DB();
      const collection = db.createCollection('users');
      expect(collection).toBeDefined();
      expect(collection.name).toBe('users');
    });

    it('should create collection with initial data', () => {
      const db = new DB();
      const initialData = [{ id: 1, name: 'John' }];
      const collection = db.createCollection('users', initialData);
      expect(collection.find(1)).toEqual({ id: 1, name: 'John' });
    });

    it('should throw error when creating duplicate collection', () => {
      const db = new DB();
      db.createCollection('users');
      expect(() => db.createCollection('users')).toThrow('Collection users already exists');
    });
  });

  describe('getCollection', () => {
    it('should return existing collection', () => {
      const db = new DB();
      const created = db.createCollection('users');
      const retrieved = db.getCollection('users');
      expect(retrieved).toBe(created);
    });

    it('should throw error for non-existent collection', () => {
      const db = new DB();
      expect(() => db.getCollection('users')).toThrow(MirageError);
    });
  });

  describe('loadData', () => {
    it('should create collections and load data', () => {
      const db = new DB();
      const data = {
        users: [{ id: 1, name: 'John' }],
        posts: [{ id: 1, title: 'Post 1' }],
      };
      db.loadData(data);
      expect(db.getCollection('users').find(1)).toEqual({ id: 1, name: 'John' });
      expect(db.getCollection('posts').find(1)).toEqual({ id: 1, title: 'Post 1' });
    });

    it('should handle empty data', () => {
      const db = new DB();
      db.loadData({});
      expect(db.dump()).toEqual({});
    });
  });

  describe('emptyData', () => {
    it('should clear all collections', () => {
      const db = new DB();
      db.loadData({
        users: [{ id: 1, name: 'John' }],
        posts: [{ id: 1, title: 'Post 1' }],
      });
      db.emptyData();
      expect(db.getCollection('users').size).toBe(0);
      expect(db.getCollection('posts').size).toBe(0);
    });

    it('should handle empty database', () => {
      const db = new DB();
      expect(() => db.emptyData()).not.toThrow();
    });
  });

  describe('dump', () => {
    it('should return all collection data', () => {
      const db = new DB();
      const data = {
        users: [{ id: 1, name: 'John' }],
        posts: [{ id: 1, title: 'Post 1' }],
      };
      db.loadData(data);
      expect(db.dump()).toEqual(data);
    });

    it('should return empty object for empty database', () => {
      const db = new DB();
      expect(db.dump()).toEqual({});
    });

    it('should return updated data after modifications', () => {
      const db = new DB();
      db.loadData({
        users: [{ id: 1, name: 'John' }],
      });
      db.getCollection('users').insert({ name: 'Jane' });
      expect(db.dump()).toEqual({
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
      });
    });
  });
});
