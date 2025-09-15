import ModelBuilder, { model } from '@src/model/ModelBuilder';

describe('ModelBuilder', () => {
  interface UserAttrs {
    id: string;
    name: string;
    email: string;
    age?: number;
  }

  describe('ModelBuilder class', () => {
    it('should create a ModelBuilder instance', () => {
      const builder = new ModelBuilder('user', 'users');
      expect(builder).toBeInstanceOf(ModelBuilder);
    });

    it('should allow method chaining with attrs()', () => {
      const builder = new ModelBuilder('user', 'users').attrs<UserAttrs>();
      expect(builder).toBeInstanceOf(ModelBuilder);
    });

    it('should create a ModelTemplate with create()', () => {
      const userModel = new ModelBuilder('user', 'users').attrs<UserAttrs>().create();

      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
      expect(typeof userModel.key).toBe('symbol');
      expect(userModel.attrs).toEqual({});
    });

    it('should include default attrs in the template', () => {
      const defaultAttrs = { name: 'Anonymous', email: 'anonymous@example.com' };
      const userModel = new ModelBuilder('user', 'users').attrs<UserAttrs>(defaultAttrs).create();

      expect(userModel.attrs).toEqual(defaultAttrs);
      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
    });
  });

  describe('model() function', () => {
    it('should create a ModelBuilder instance', () => {
      const builder = model('user', 'users');
      expect(builder).toBeInstanceOf(ModelBuilder);
    });

    it('should support fluent API', () => {
      const userModel = model('user', 'users').attrs<UserAttrs>().create();

      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
    });

    it('should create template with typed attributes', () => {
      const userModel = model('user', 'users').attrs<UserAttrs>().create();

      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
      expect(userModel.attrs).toEqual({});
    });

    it('should work with default attributes', () => {
      const defaultAttrs = { name: 'John', email: 'john@example.com' };
      const userModel = model('user', 'users').attrs<UserAttrs>(defaultAttrs).create();

      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
      expect(userModel.attrs).toEqual(defaultAttrs);
    });

    it('should work without explicit attrs() call', () => {
      const userModel = model('user', 'users').create();

      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
      expect(userModel.attrs).toEqual({});
    });
  });

  describe('type safety', () => {
    it('should maintain type information through the builder chain', () => {
      const userModel = model('user', 'users').attrs<UserAttrs>().create();

      // These should be type-safe (no TypeScript errors)
      expect(userModel.modelName).toBe('user');
      expect(userModel.collectionName).toBe('users');
      expect(typeof userModel.key).toBe('symbol');
      expect(typeof userModel.attrs).toBe('object');
    });

    it('should preserve default attributes types', () => {
      const defaultAttrs: Partial<UserAttrs> = {
        name: 'Test User',
        email: 'test@example.com',
      };
      const userModel = model('user', 'users').attrs<UserAttrs>(defaultAttrs).create();

      expect(userModel.attrs).toEqual(defaultAttrs);
    });
  });
});
