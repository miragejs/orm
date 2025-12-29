import IdentityManager, {
  StringIdentityManager,
  NumberIdentityManager,
} from '../IdentityManager';

describe('IdentityManager', () => {
  describe('constructor', () => {
    it('should initialize with required initialCounter', () => {
      const manager = new IdentityManager({ initialCounter: '5' });
      expect(manager).toBeDefined();
    });

    it('should initialize with custom counter', () => {
      const manager = new IdentityManager({ initialCounter: '5' });
      expect(manager.get()).toBe('5');
    });

    it('should initialize with custom used IDs', () => {
      const usedIds = ['1', '2', '3'];
      const manager = new IdentityManager({
        initialCounter: '1',
        initialUsedIds: usedIds,
      });
      expect(manager.get()).toBe('4');
    });

    it('should initialize with default string counter', () => {
      const manager = new IdentityManager({ initialCounter: '1' });
      expect(manager.get()).toBe('1');
    });
  });

  describe('get', () => {
    let manager: IdentityManager;

    beforeEach(() => {
      manager = new IdentityManager({ initialCounter: '1' });
    });

    it('should return next available ID without marking it as used', () => {
      expect(manager.get()).toBe('1');
      manager.set('1');
      expect(manager.get()).toBe('2');
      expect(manager.get()).toBe('2');
    });

    it('should skip used IDs when finding next available', () => {
      manager.set('1');
      manager.set('3');
      expect(manager.get()).toBe('2'); // Should find the gap
      manager.set('2');
      expect(manager.get()).toBe('4'); // Should find next available after gap is filled
    });
  });

  describe('set', () => {
    let manager: IdentityManager;

    beforeEach(() => {
      manager = new IdentityManager({ initialCounter: '1' });
    });

    it('should mark ID as used', () => {
      manager.set('1');
      manager.set('2');
      expect(manager.get()).toBe('3');
    });

    it('should not throw when setting already used ID', () => {
      manager.set('1');
      expect(() => manager.set('1')).not.toThrow();
    });
  });

  describe('fetch', () => {
    it('should get and mark ID as used', () => {
      const manager = new IdentityManager({ initialCounter: '1' });
      expect(manager.fetch()).toBe('1');
      expect(manager.fetch()).toBe('2');
      expect(manager.get()).toBe('3');
    });

    it('should increment counter after fetching', () => {
      const manager = new IdentityManager({ initialCounter: '1' });
      manager.fetch(); // gets '1', counter becomes '2'
      expect(manager.get()).toBe('2');
    });
  });

  describe('reset', () => {
    it('should clear used IDs and reset counter', () => {
      const manager = new IdentityManager<string>({ initialCounter: '1' });
      manager.set('1');
      manager.set('2');
      manager.reset();
      expect(manager.get()).toBe('1');
      expect(() => manager.set('1')).not.toThrow();
    });

    it('should reset to initial counter value', () => {
      const manager = new IdentityManager<string>({ initialCounter: '10' });
      manager.set('10');
      manager.set('11');
      manager.reset();
      expect(manager.get()).toBe('10');
    });
  });

  describe('default generator with string IDs', () => {
    it('should increment numeric string IDs', () => {
      const manager = new IdentityManager({ initialCounter: '1' });
      expect(manager.get()).toBe('1');
      expect(manager.fetch()).toBe('1');
      expect(manager.get()).toBe('2');
      expect(manager.fetch()).toBe('2');
      expect(manager.get()).toBe('3');
    });

    it('should handle large numbers correctly', () => {
      const manager = new IdentityManager({ initialCounter: '999' });
      expect(manager.fetch()).toBe('999');
      expect(manager.get()).toBe('1000');
    });

    it('should handle non-numeric string IDs with error', () => {
      expect(() => {
        new IdentityManager<string>({
          initialCounter: 'abc',
        });
      }).toThrow('Default ID generator only works with numeric string IDs');
    });

    it('should handle mixed numeric and non-numeric strings', () => {
      expect(() => {
        new IdentityManager<string>({
          initialCounter: '123abc',
        });
      }).toThrow('Default ID generator only works with numeric string IDs');
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

    it('should work with number IDs when explicitly typed', () => {
      const numberManager = new IdentityManager<number>({
        initialCounter: 5,
      });

      expect(numberManager.get()).toBe(5);
      expect(numberManager.fetch()).toBe(5);
      expect(numberManager.get()).toBe(6);
    });

    it('should work with custom number generator', () => {
      const numberManager = new IdentityManager<number>({
        initialCounter: 1,
        idGenerator: (currentId) => currentId * 2,
      });

      expect(numberManager.get()).toBe(1);
      expect(numberManager.fetch()).toBe(1);
      expect(numberManager.get()).toBe(2);
      expect(numberManager.fetch()).toBe(2);
      expect(numberManager.get()).toBe(4);
    });

    it('should work with UUID-like generators', () => {
      const uuidManager = new IdentityManager<string>({
        initialCounter: 'uuid-1',
        idGenerator: (currentId) => {
          const num = parseInt(currentId.split('-')[1]);
          return `uuid-${num + 1}`;
        },
      });

      expect(uuidManager.get()).toBe('uuid-1');
      expect(uuidManager.fetch()).toBe('uuid-1');
      expect(uuidManager.get()).toBe('uuid-2');
    });
  });
});

describe('StringIdentityManager', () => {
  describe('constructor', () => {
    it('should initialize with default string counter "1"', () => {
      const manager = new StringIdentityManager();
      expect(manager.get()).toBe('1');
    });

    it('should allow custom initialCounter override', () => {
      const manager = new StringIdentityManager({ initialCounter: '10' });
      expect(manager.get()).toBe('10');
    });

    it('should allow custom used IDs', () => {
      const manager = new StringIdentityManager({ initialUsedIds: ['1', '3'] });
      expect(manager.get()).toBe('2');
    });

    it('should allow custom ID generator', () => {
      const manager = new StringIdentityManager({
        idGenerator: (currentId) => `id_${Number(currentId) + 1}`,
      });
      expect(manager.get()).toBe('1');
      expect(manager.fetch()).toBe('1');
      expect(manager.get()).toBe('id_2');
    });
  });

  describe('basic functionality', () => {
    let manager: StringIdentityManager;

    beforeEach(() => {
      manager = new StringIdentityManager();
    });

    it('should increment string IDs correctly', () => {
      expect(manager.get()).toBe('1');
      expect(manager.fetch()).toBe('1');
      expect(manager.get()).toBe('2');
      expect(manager.fetch()).toBe('2');
      expect(manager.get()).toBe('3');
    });

    it('should handle gaps in used IDs', () => {
      manager.set('1');
      manager.set('3');
      expect(manager.get()).toBe('2');
      manager.set('2');
      expect(manager.get()).toBe('4');
    });

    it('should reset to default string counter', () => {
      manager.set('1');
      manager.set('2');
      manager.reset();
      expect(manager.get()).toBe('1');
    });
  });
});

describe('NumberIdentityManager', () => {
  describe('constructor', () => {
    it('should initialize with default number counter 1', () => {
      const manager = new NumberIdentityManager();
      expect(manager.get()).toBe(1);
    });

    it('should allow custom initialCounter override', () => {
      const manager = new NumberIdentityManager({ initialCounter: 10 });
      expect(manager.get()).toBe(10);
    });

    it('should allow custom used IDs', () => {
      const manager = new NumberIdentityManager({ initialUsedIds: [1, 3] });
      expect(manager.get()).toBe(2);
    });

    it('should allow custom ID generator', () => {
      const manager = new NumberIdentityManager({
        idGenerator: (currentId) => currentId * 2,
      });
      expect(manager.get()).toBe(1);
      expect(manager.fetch()).toBe(1);
      expect(manager.get()).toBe(2);
    });
  });

  describe('basic functionality', () => {
    let manager: NumberIdentityManager;

    beforeEach(() => {
      manager = new NumberIdentityManager();
    });

    it('should increment number IDs correctly', () => {
      expect(manager.get()).toBe(1);
      expect(manager.fetch()).toBe(1);
      expect(manager.get()).toBe(2);
      expect(manager.fetch()).toBe(2);
      expect(manager.get()).toBe(3);
    });

    it('should handle gaps in used IDs', () => {
      manager.set(1);
      manager.set(3);
      expect(manager.get()).toBe(2);
      manager.set(2);
      expect(manager.get()).toBe(4);
    });

    it('should reset to default number counter', () => {
      manager.set(1);
      manager.set(2);
      manager.reset();
      expect(manager.get()).toBe(1);
    });

    it('should handle large numbers correctly', () => {
      const largeManager = new NumberIdentityManager({ initialCounter: 999 });
      expect(largeManager.fetch()).toBe(999);
      expect(largeManager.get()).toBe(1000);
    });
  });
});
