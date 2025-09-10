import { token, TokenBuilder } from '@src/token';

describe('token', () => {
  it('should create a TokenBuilder instance with correct model and collection names', () => {
    const builder = token('user', 'users');
    expect(builder).toBeInstanceOf(TokenBuilder);

    const userToken = builder.create();
    expect(userToken.modelName).toBe('user');
    expect(userToken.collectionName).toBe('users');
  });

  it('should preserve string literal types for model and collection names', () => {
    const builder = token('post', 'posts');
    const postToken = builder.create();

    expect(postToken.modelName).toBe('post');
    expect(postToken.collectionName).toBe('posts');
    expect(typeof postToken.key).toBe('symbol');
  });

  it('should create unique symbols for different model names', () => {
    const userToken = token('user', 'users').create();
    const postToken = token('post', 'posts').create();
    const anotherUserToken = token('user', 'users').create();

    expect(userToken.key).not.toBe(postToken.key);
    expect(userToken.key).not.toBe(anotherUserToken.key);
    expect(userToken.key.description).toBe('user');
    expect(postToken.key.description).toBe('post');
  });

  it('should work with method chaining for attrs configuration', () => {
    interface UserAttrs {
      id: string;
      name: string;
      email: string;
    }

    const userToken = token('user', 'users').attrs<UserAttrs>().create();

    expect(userToken.modelName).toBe('user');
    expect(userToken.collectionName).toBe('users');
    expect(typeof userToken.key).toBe('symbol');
  });

  it('should work with method chaining for serialization configuration', () => {
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

    const userToken = token('user', 'users')
      .attrs<UserAttrs>()
      .serialization<User, UserList>()
      .create();

    expect(userToken.modelName).toBe('user');
    expect(userToken.collectionName).toBe('users');
    expect(typeof userToken.key).toBe('symbol');
  });

  it('should handle different id types', () => {
    interface UserWithStringId {
      id: string;
      name: string;
    }

    interface PostWithNumberId {
      id: number;
      title: string;
    }

    const userToken = token('user', 'users').attrs<UserWithStringId>().create();
    const postToken = token('post', 'posts').attrs<PostWithNumberId>().create();

    expect(userToken.modelName).toBe('user');
    expect(postToken.modelName).toBe('post');
  });
});
