import { TokenBuilder, type BaseModelAttrs, type ModelSerialization } from '@src/token';

describe('TokenBuilder', () => {
  let builder: TokenBuilder<
    BaseModelAttrs<string>,
    ModelSerialization<BaseModelAttrs<string>>,
    'test',
    'tests'
  >;

  beforeEach(() => {
    builder = new TokenBuilder('test', 'tests');
  });

  describe('constructor', () => {
    it('should create a TokenBuilder with model and collection names', () => {
      expect(builder).toBeInstanceOf(TokenBuilder);
    });
  });

  describe('attrs method', () => {
    it('should return a new TokenBuilder instance with specified model type', () => {
      interface TestModel {
        id: string;
        name: string;
        value: number;
      }

      const typedBuilder = builder.attrs<TestModel>();

      expect(typedBuilder).toBeInstanceOf(TokenBuilder);
      expect(typedBuilder).not.toBe(builder); // Should be a new instance
    });

    it('should preserve model and collection names when setting attrs', () => {
      interface UserAttrs {
        id: string;
        email: string;
        name: string;
      }

      const userToken = builder.attrs<UserAttrs>().create();

      expect(userToken.modelName).toBe('test');
      expect(userToken.collectionName).toBe('tests');
    });

    it('should allow method chaining', () => {
      interface UserAttrs {
        id: string;
        email: string;
      }

      const token = builder.attrs<UserAttrs>().create();

      expect(token.modelName).toBe('test');
      expect(token.collectionName).toBe('tests');
    });
  });

  describe('serialization method', () => {
    it('should return a new TokenBuilder instance with custom serialization types', () => {
      interface SerializedModel {
        id: string;
        displayName: string;
      }

      interface SerializedCollection {
        items: SerializedModel[];
        total: number;
      }

      const serializedBuilder = builder.serialization<SerializedModel, SerializedCollection>();

      expect(serializedBuilder).toBeInstanceOf(TokenBuilder);
      expect(serializedBuilder).not.toBe(builder);
    });

    it('should work with default collection type (array)', () => {
      interface SerializedModel {
        id: string;
        name: string;
      }

      const serializedBuilder = builder.serialization<SerializedModel>();
      const token = serializedBuilder.create();

      expect(token.modelName).toBe('test');
      expect(token.collectionName).toBe('tests');
    });

    it('should allow method chaining with attrs', () => {
      interface UserAttrs {
        id: string;
        name: string;
        email: string;
      }

      interface User {
        id: string;
        displayName: string;
      }

      interface UserList {
        users: User[];
        total: number;
      }

      const token = builder.attrs<UserAttrs>().serialization<User, UserList>().create();

      expect(token.modelName).toBe('test');
      expect(token.collectionName).toBe('tests');
    });
  });

  describe('create method', () => {
    it('should create a ModelToken with correct properties', () => {
      const token = builder.create();

      expect(token).toHaveProperty('modelName', 'test');
      expect(token).toHaveProperty('collectionName', 'tests');
      expect(token).toHaveProperty('key');
      expect(typeof token.key).toBe('symbol');
    });

    it('should create unique symbols for each token creation', () => {
      const token1 = builder.create();
      const token2 = builder.create();

      expect(token1.key).not.toBe(token2.key);
      expect(token1.key.description).toBe('test');
      expect(token2.key.description).toBe('test');
    });

    it('should work with complex type configurations', () => {
      interface ComplexModel {
        id: number;
        metadata: {
          createdAt: Date;
          updatedAt: Date;
        };
        tags: string[];
      }

      interface ComplexSerializedModel {
        id: number;
        metadata: {
          createdAt: string;
          updatedAt: string;
        };
        tagCount: number;
      }

      interface ComplexCollection {
        items: ComplexSerializedModel[];
        pagination: {
          page: number;
          total: number;
        };
      }

      const complexToken = builder
        .attrs<ComplexModel>()
        .serialization<ComplexSerializedModel, ComplexCollection>()
        .create();

      expect(complexToken.modelName).toBe('test');
      expect(complexToken.collectionName).toBe('tests');
      expect(typeof complexToken.key).toBe('symbol');
    });
  });

  describe('fluent interface', () => {
    it('should support multiple method chaining patterns', () => {
      interface UserAttrs {
        id: string;
        name: string;
      }

      interface User {
        id: string;
        displayName: string;
      }

      // Pattern 1: attrs then serialization
      const token1 = builder.attrs<UserAttrs>().serialization<User>().create();

      // Pattern 2: serialization then attrs (should reset serialization)
      const token2 = builder.serialization<User>().attrs<UserAttrs>().create();

      expect(token1.modelName).toBe('test');
      expect(token2.modelName).toBe('test');
      expect(token1.key).not.toBe(token2.key);
    });

    it('should allow creating multiple tokens from the same builder chain', () => {
      interface UserAttrs {
        id: string;
        name: string;
      }

      const configuredBuilder = builder.attrs<UserAttrs>();

      const token1 = configuredBuilder.create();
      const token2 = configuredBuilder.create();

      expect(token1.modelName).toBe(token2.modelName);
      expect(token1.collectionName).toBe(token2.collectionName);
      expect(token1.key).not.toBe(token2.key); // Different symbols
    });
  });
});
