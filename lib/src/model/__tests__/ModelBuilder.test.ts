import { MirageError } from '@src/utils';

import ModelBuilder, { model } from '../ModelBuilder';

// Define test model attributes
interface UserAttrs {
  id: string;
  name: string;
  email: string;
  age?: number;
}

describe('ModelBuilder', () => {
  describe('ModelBuilder class', () => {
    it('should create a ModelBuilder instance', () => {
      const builder = new ModelBuilder();
      expect(builder).toBeInstanceOf(ModelBuilder);
    });

    it('should allow method chaining with name() and collection()', () => {
      const builder = new ModelBuilder().name('user').collection('users');
      expect(builder).toBeInstanceOf(ModelBuilder);
    });

    it('should allow method chaining with attrs()', () => {
      const builder = new ModelBuilder()
        .name('user')
        .collection('users')
        .attrs<UserAttrs>();
      expect(builder).toBeInstanceOf(ModelBuilder);
    });

    it('should create a ModelTemplate with create()', () => {
      const userModel = new ModelBuilder()
        .name('user')
        .collection('users')
        .attrs<UserAttrs>()
        .build();

      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
      expect(typeof userModel.key).toBe('symbol');
    });

    it('should throw error if name is not set', () => {
      expect(() => {
        new ModelBuilder().collection('users').build();
      }).toThrow('Model name is required');
    });

    it('should throw error if collection is not set', () => {
      expect(() => {
        new ModelBuilder().name('user').build();
      }).toThrow('Collection name is required');
    });
  });

  describe('model()', () => {
    it('should create a ModelBuilder instance', () => {
      const builder = model();
      expect(builder).toBeInstanceOf(ModelBuilder);
    });

    it('should support fluent API', () => {
      const userModel = model()
        .name('user')
        .collection('users')
        .attrs<UserAttrs>()
        .build();

      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
    });

    it('should create template with typed attributes', () => {
      const userModel = model()
        .name('user')
        .collection('users')
        .attrs<UserAttrs>()
        .build();

      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
    });

    it('should work without explicit attrs() call', () => {
      const userModel = model().name('user').collection('users').build();

      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
    });

    it('should allow flexible method order', () => {
      const userModel1 = model().name('user').collection('users').build();
      const userModel2 = model().collection('users').name('user').build();

      expect(userModel1.modelName).toBe('user');
      expect(userModel1.collectionName).toBe('users');
      expect(userModel2.modelName).toBe('user');
      expect(userModel2.collectionName).toBe('users');
    });
  });

  describe('type safety', () => {
    it('should maintain type information through the builder chain', () => {
      const userModel = model()
        .name('user')
        .collection('users')
        .attrs<UserAttrs>()
        .build();

      // These should be type-safe (no TypeScript errors)
      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
      expect(typeof userModel.key).toBe('symbol');
    });

    it('should support json() method for specifying serialization types', () => {
      interface UserJSON {
        id: string;
        name: string;
      }

      const userModel = model()
        .name('user')
        .collection('users')
        .attrs<UserAttrs>()
        .json<UserJSON>()
        .build();

      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
      expect(typeof userModel.key).toBe('symbol');
    });
  });

  describe('Validation', () => {
    it('should throw error for empty model name', () => {
      expect(() => {
        model().name('').collection('users').build();
      }).toThrow(MirageError);

      expect(() => {
        model().name('').collection('users').build();
      }).toThrow('Model name must be a non-empty string');
    });

    it('should throw error for whitespace-only model name', () => {
      expect(() => {
        model().name('   ').collection('users').build();
      }).toThrow('Model name must be a non-empty string');
    });

    it('should throw error for empty collection name', () => {
      expect(() => {
        model().name('user').collection('').build();
      }).toThrow(MirageError);

      expect(() => {
        model().name('user').collection('').build();
      }).toThrow('Collection name must be a non-empty string');
    });

    it('should throw error for whitespace-only collection name', () => {
      expect(() => {
        model().name('user').collection('   ').build();
      }).toThrow('Collection name must be a non-empty string');
    });

    it('should throw error when name() is not called before create()', () => {
      expect(() => {
        model().collection('users').build();
      }).toThrow(MirageError);

      expect(() => {
        model().collection('users').build();
      }).toThrow('Model name is required');
    });

    it('should throw error when collection() is not called before create()', () => {
      expect(() => {
        model().name('user').build();
      }).toThrow(MirageError);

      expect(() => {
        model().name('user').build();
      }).toThrow('Collection name is required');
    });
  });
});
