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
      expect(manager.get()).toBe(4);
    });
  });

  describe('get', () => {
    let manager: IdentityManager;

    beforeEach(() => {
      manager = new IdentityManager();
    });

    it('should return next available ID without marking it as used', () => {
      expect(manager.get()).toBe(1);
      manager.set(1);
      expect(manager.get()).toBe(2);
      expect(manager.get()).toBe(2);
    });
  });

  describe('set', () => {
    let manager: IdentityManager;

    beforeEach(() => {
      manager = new IdentityManager();
    });

    it('should mark ID as used', () => {
      manager.set(1);
      manager.set(2);
      expect(manager.get()).toBe(3);
    });
  });

  describe('fetch', () => {
    it('should get and mark ID as used', () => {
      const manager = new IdentityManager();
      expect(manager.fetch()).toBe(1);
      expect(manager.fetch()).toBe(2);
      expect(manager.get()).toBe(3);
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
        initialCounter: 'id_1',
        idGenerator: (currentId) => {
          const num = parseInt(currentId.split('_')[1]);
          return `id_${num + 1}`;
        },
      });

      expect(stringManager.get()).toBe('id_1');
      expect(stringManager.fetch()).toBe('id_1');

      stringManager.set('id_2');
      expect(stringManager.get()).toBe('id_3');
    });
  });
});
