import { IdentityManager } from '@src/db';

describe('IdentityManager', () => {
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const manager = new IdentityManager();
      expect(manager).toBeDefined();
    });

    it('should initialize with custom counter', () => {
      const manager = new IdentityManager({ initialCounter: 5 });
      expect(manager.get()).toBe(5);
    });

    it('should initialize with custom used IDs', () => {
      const usedIds = new Set([1, 2, 3]);
      const manager = new IdentityManager({ initialUsedIds: usedIds });
      expect(() => manager.set(1)).toThrow();
      expect(() => manager.set(2)).toThrow();
      expect(() => manager.set(3)).toThrow();
      expect(manager.get()).toBe(4);
    });
  });

  describe('get', () => {
    let manager: IdentityManager;

    beforeEach(() => {
      manager = new IdentityManager();
    });

    it('should return next available ID', () => {
      expect(manager.get()).toBe(1);
      expect(manager.get()).toBe(2);
      expect(manager.get()).toBe(3);
    });

    it('should skip used IDs', () => {
      manager.set(2);
      expect(manager.get()).toBe(1);
      expect(manager.get()).toBe(3);
    });
  });

  describe('set', () => {
    let manager: IdentityManager;

    beforeEach(() => {
      manager = new IdentityManager();
    });

    it('should mark ID as used', () => {
      manager.set(5);
      expect(() => manager.set(5)).toThrow();
    });

    it('should throw error when setting already used ID', () => {
      manager.set(1);
      expect(() => manager.set(1)).toThrow();
    });
  });

  describe('fetch', () => {
    it('should get and mark ID as used', () => {
      const manager = new IdentityManager();
      const id = manager.fetch();
      expect(id).toBe(1);
      expect(() => manager.set(1)).toThrow();
    });
  });

  describe('reset', () => {
    it('should clear used IDs and reset counter', () => {
      const manager = new IdentityManager();
      manager.set(1);
      manager.set(2);
      manager.reset();
      expect(manager.get()).toBe(1);
      expect(() => manager.set(1)).not.toThrow();
    });
  });

  describe('custom ID generator', () => {
    it('should use custom generator for string IDs', () => {
      const stringManager = new IdentityManager<string>({
        initialCounter: 'id_0',
        idGenerator: (currentId) => {
          const num = parseInt(currentId.split('_')[1]);
          return `id_${num + 1}`;
        },
      });

      expect(stringManager.get()).toBe('id_0');
      expect(stringManager.get()).toBe('id_1');
      expect(stringManager.get()).toBe('id_2');
    });
  });
});
