import { defineModel } from '@src/model';
import { defineToken } from '@src/model/ModelToken';
import type { ModelSerialization } from '@src/model/types';

import Serializer, { type SerializerConfig } from './Serializer';

// Define a model interface
interface UserModel {
  id: string;
  name: string;
  email: string;
  password?: string;
}

// Define custom serialization types for individual models and collections
type UserSerializationTypes = ModelSerialization<
  {
    id: string;
    fullName: string;
    emailAddress: string;
  },
  {
    users: Array<{
      id: string;
      fullName: string;
      emailAddress: string;
    }>;
    totalCount: number;
  }
>;

// Create different token variations to demonstrate flexibility

// 1. Default serialization (model = UserModel, collection = UserModel[])
const BasicUserToken = defineToken<UserModel>('user', 'users');

// 2. Custom serialization for both model and collection
// Notice: ModelSerialization now only needs model and collection types (no TModel parameter)
const AdvancedUserToken = defineToken<UserModel, UserSerializationTypes>('user', 'users');

// 3. Array-only collection serialization
type SimpleUserSerializationTypes = ModelSerialization<
  Pick<UserModel, 'id' | 'name' | 'email'>, // Model serialization type
  Pick<UserModel, 'id' | 'name' | 'email'>[] // Collection serialization type
>;

const SimpleUserToken = defineToken<UserModel, SimpleUserSerializationTypes>('user', 'users');

// 4. Even simpler inline usage
const CompactUserToken = defineToken<
  UserModel,
  ModelSerialization<
    { id: string; displayName: string }, // Model type
    { count: number; items: { id: string; displayName: string }[] } // Collection type
  >
>('user', 'users');

const UserClass = defineModel(BasicUserToken);

const user = new UserClass({
  attrs: {
    name: 'John Doe',
    email: 'john@example.com',
  },
}).save();

const users = [user, user]; // Mock multiple users

// Example 1: Basic serialization (default types)
console.log('=== Basic Serialization (Default Types) ===');
const basicSerializer = new Serializer(BasicUserToken, {
  attrs: ['id', 'name', 'email'],
  root: false,
});

const basicSerializedUser = basicSerializer.serialize(user);
// Type: UserModel (filtered by attrs)
console.log('Basic serialized user:', basicSerializedUser);

const basicSerializedUsers = basicSerializer.serializeCollection(users);
// Type: UserModel[] (array of filtered models)
console.log('Basic serialized users:', basicSerializedUsers);

// Example 2: Advanced serialization (custom model and collection types)
console.log('\n=== Advanced Serialization (Custom Types) ===');

// Custom serializer that transforms data to match UserSerializationTypes
class AdvancedUserSerializer extends Serializer<typeof AdvancedUserToken> {
  // Override to transform individual models
  serialize(model: any) {
    return {
      id: model.id,
      fullName: model.name,
      emailAddress: model.email,
    } as any; // Simplified for example
  }

  // Override to transform collections
  serializeCollection(models: any[]) {
    return {
      users: models.map((model) => ({
        id: model.id,
        fullName: model.name,
        emailAddress: model.email,
      })),
      totalCount: models.length,
    } as any; // Simplified for example
  }
}

const advancedSerializer = new AdvancedUserSerializer(AdvancedUserToken, {});

const advancedSerializedUser = advancedSerializer.serialize(user);
// Type: { id: string; fullName: string; emailAddress: string; }
console.log('Advanced serialized user:', advancedSerializedUser);

const advancedSerializedUsers = advancedSerializer.serializeCollection(users);
// Type: { users: Array<{id: string; fullName: string; emailAddress: string;}>; totalCount: number; }
console.log('Advanced serialized users:', advancedSerializedUsers);

// Example 3: Simple array collection serialization
console.log('\n=== Simple Serialization (Array Collections) ===');
const simpleSerializer = new Serializer(SimpleUserToken, {
  attrs: ['id', 'name', 'email'],
  root: false,
});

const simpleSerializedUser = simpleSerializer.serialize(user);
// Type: Pick<UserModel, 'id' | 'name' | 'email'>
console.log('Simple serialized user:', simpleSerializedUser);

const simpleSerializedUsers = simpleSerializer.serializeCollection(users);
// Type: Pick<UserModel, 'id' | 'name' | 'email'>[]
console.log('Simple serialized users:', simpleSerializedUsers);

// Example 4: Explicit type specification
console.log('\n=== Explicit Type Specification ===');
const explicitSerializer = new Serializer<
  typeof AdvancedUserToken,
  SerializerConfig<typeof AdvancedUserToken>,
  UserSerializationTypes['model'], // Explicit model type
  UserSerializationTypes['collection'] // Explicit collection type
>(AdvancedUserToken, {
  attrs: ['id', 'name', 'email'],
  root: false,
});

// TypeScript knows the exact return types
const explicitModel = explicitSerializer.serialize(user);
const explicitCollection = explicitSerializer.serializeCollection(users);

// Example 5: Demonstrate the simplified ModelSerialization usage
console.log('\n=== Simplified ModelSerialization Usage ===');
// Before: ModelSerialization<TModel, TSerializedModel, TSerializedCollection> (3 params)
// After: ModelSerialization<TSerializedModel, TSerializedCollection> (2 params)

type CleanAPIResponse = ModelSerialization<
  { user: UserModel }, // Clean model wrapper
  { data: UserModel[]; meta: { total: number; page: number } } // Paginated collection
>;

const cleanToken = defineToken<UserModel, CleanAPIResponse>('user', 'users');
const cleanSerializer = new Serializer(cleanToken, {});

// Much cleaner and more focused on what matters: the serialization output types!
