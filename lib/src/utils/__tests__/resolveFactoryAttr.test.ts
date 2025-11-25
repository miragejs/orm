import { Factory } from '@src/factory';
import { model } from '@src/model';
import { collection, schema, type CollectionConfig } from '@src/schema';

import { resolveFactoryAttr } from '../resolveFactoryAttr';

interface UserAttrs {
  age?: number;
  bio?: string;
  createdAt?: string | null;
  email: string;
  id: string;
  name: string;
  processed?: boolean;
  role?: string;
  subscription?: string;
  manager?: string;
}

// Create test model
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();

// Define test model type
type UserModel = typeof userModel;

describe('resolveFactoryAttr', () => {
  it('should call function attributes with modelId', () => {
    const attr = (id: string) => `value-${id}`;
    const result = resolveFactoryAttr(attr, '123');
    expect(result).toBe('value-123');
  });

  it('should return static values as-is', () => {
    const attr = 'static-value';
    const result = resolveFactoryAttr(attr, '123');
    expect(result).toBe('static-value');
  });

  it('should work with complex types', () => {
    const attr = (id: number) => ({ count: id * 2, valid: true });
    const result = resolveFactoryAttr(attr, 5);
    expect(result).toEqual({ count: 10, valid: true });
  });

  it('should work with arrays', () => {
    const attr = (id: string) => [`item-${id}`, 'static'];
    const result = resolveFactoryAttr(attr, 'abc');
    expect(result).toEqual(['item-abc', 'static']);
  });

  it('should be usable in factory attribute functions', () => {
    type LocalSchema = {
      users: CollectionConfig<UserModel, {}, Factory<UserModel, string, LocalSchema>>;
    };

    const factory = new Factory<UserModel, string, LocalSchema>(userModel, {
      name: () => 'John Doe',
      email: function (id: string) {
        const name = resolveFactoryAttr(this.name, id);
        return `${name}@example.com`.toLowerCase().replace(/\s+/g, '.');
      },
    });

    const localSchema = schema()
      .collections({
        users: collection().model(userModel).factory(factory).create(),
      })
      .setup();

    const attrs = factory.build(localSchema);
    expect(attrs.email).toBe('john.doe@example.com');
  });
});
