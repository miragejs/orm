<div align="center">

<img src="./docs/logo.svg" alt="MirageJS Logo" width="100" />

# MirageJS ORM

> A TypeScript-first ORM for building in-memory databases with models, relationships, and factories

[![npm version](https://img.shields.io/npm/v/miragejs-orm)](https://www.npmjs.com/package/miragejs-orm)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/miragejs-orm)](https://bundlephobia.com/package/miragejs-orm)
[![License](https://img.shields.io/npm/l/miragejs-orm)](./LICENSE)
[![Coverage](https://img.shields.io/badge/coverage-96%25-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)

</div>

---

## ✨ What is miragejs-orm?

**miragejs-orm** is a complete TypeScript rewrite of the powerful ORM layer from MirageJS, designed to give frontend developers the freedom to quickly create type-safe mocks for both testing and development—without backend dependencies.

Build realistic, relational data models in memory with factories, traits, relationships, and serialization, all with **100% type safety** and a modern, fluent API.

---

## 🚀 Why Choose miragejs-orm?

### Compared to MirageJS

While MirageJS is an excellent solution for full API mocking, `miragejs-orm` takes the most powerful part - the ORM — and enhances it:

- **🎯 Fully Rewritten in TypeScript** - Built from the ground up with TypeScript, providing complete type safety and excellent IDE autocomplete
- **🪶 Zero Dependencies** - No external dependencies means smaller bundle size (~50KB) and no supply chain concerns
- **🔌 Framework Agnostic** - Use with any HTTP interceptor library (MSW, Mirage Server, Axios interceptors, etc.) or testing framework
- **⚡ Modern Fluent API** - Declarative builder patterns let you construct schemas, models, and factories with an intuitive, chainable API
- **📦 No Inflection Magic** - You control exactly how your model names and attributes are formatted - what you define is what you get
- **✅ Battle Tested** - 700+ test cases with 96% code coverage, including type tests, ensure reliability
- **🔧 Modern Tooling** - Built with modern build tools and package standards for optimal developer experience

### Key Benefits

- **Develop UI-First** - Don't wait for backend APIs. Build complete frontend features with realistic data
- **Type-Safe Mocking** - Full TypeScript support means your mocks stay in sync with your types
- **Flexible Data Modeling** - Create models that mirror your backend entities OR design custom models for specific endpoints
- **Built-in Serialization** - Transform your data on output with serializers to match API formats, hide sensitive fields, and control response structure
- **Testing & Development** - Perfect for unit tests, integration tests, Storybook stories, and development environments

---

## 💭 Philosophy

### Freedom Over Rigidity

The core idea behind `miragejs-orm` is to give frontend developers a **playground, not a prison**. We don't force you to perfectly replicate your backend architecture - instead, we give you the tools to create exactly what you need:

- **Model Your API, Your Way** – Build a complete relational model that mirrors your server, OR create minimal models for specific endpoint outputs
- **No Scope Creep** – Keep your mock data within the library's scope rather than managing complex state in route handlers or test setup
- **UI-First Development** – Get ahead of backend development and prototype features with realistic, relational data

### Schema-less but Type-Safe

We embrace a unique philosophy:

- **No Runtime Validation** – Models are schema-less by design. You're responsible for keeping your test data correct so tests meet expectations
- **100% Type Safety** – On our side, we provide complete TypeScript support to make mock management fully type-safe
- **Developer Freedom** – We give you powerful tools without imposing backend-style validation constraints

This approach means faster iteration, simpler setup, and complete control over your mock data while maintaining the benefits of TypeScript's compile-time safety.

---

<div align="center">

# 📖 Quick Guide

</div>

## 📦 Installation

```bash
npm install miragejs-orm

# or
yarn add miragejs-orm

# or
pnpm add miragejs-orm
```

---

## 🏃 Quick Start

Here's a taste of what you can do with `miragejs-orm`:

```typescript
import { model, schema, collection, factory, associations } from 'miragejs-orm';

// 1. Define your models
const userModel = model('user', 'users')
  .attrs<{ name: string; email: string }>()
  .create();

const postModel = model('post', 'posts')
  .attrs<{ title: string; content: string; authorId: string }>()
  .create();

// 2. Create factories with fake data
const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => 'John Doe',
    email: () => 'john@example.com',
  })
  .create();

// 3. Setup your schema with relationships
const appSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .factory(userFactory)
      .relationships({
        posts: associations.hasMany(postModel),
      })
      .create(),
    
    posts: collection()
      .model(postModel)
      .relationships({
        author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
      })
      .create(),
  })
  .setup();

// 4. Use it!
const user = appSchema.users.create({ name: 'Alice' });

const post = appSchema.posts.create({ 
  title: 'Hello World', 
  content: 'My first post',
  authorId: user.id 
});

console.log(user.posts.length); // 1
console.log(post.author.name);  // 'Alice'
```

---

## 📚 Core Concepts

### 1. Model Templates

**Model Templates** define the structure of your data entities. They're created using the `model()` builder and are schema-less at runtime but fully typed at compile time.

Model Templates are designed to be **shareable across your schema** - you can reference the same template when setting up relationships and collections, ensuring consistent type inference throughout your application.

```typescript
import { model } from 'miragejs-orm';

// Define your model attributes interface
interface UserAttrs {
  name: string;
  email: string;
  role?: string;
}

// Create a model template
const userModel = model('user', 'users')
  .attrs<UserAttrs>()
  .create();

// This template can now be shared across collections and relationships
```

**Key Points:**
- Model Templates are the building blocks created by the `model()` builder
- First argument is the **model name** (singular)
- Second argument is the **collection name** (plural)
- Use `.attrs<T>()` to define the TypeScript interface for your model
- Templates are **shareable** - use the same template reference for relationships and type inference
- Models are immutable once created

### 2. Collections

Collections are containers for models that live in your schema. They handle CRUD operations and queries.

```typescript
import { collection, associations } from 'miragejs-orm';

const userCollection = collection()
  .model(userModel)
  .factory(userFactory)  // Optional
  .relationships({       // Optional
    posts: associations.hasMany(postModel),
  })
  .serializer(userSerializer)  // Optional
  .create();
```

**Collection Methods:**
```typescript
// Create with factory defaults
const user = appSchema.users.create();

// Create with custom attributes
const user = appSchema.users.create({ name: 'Alice', email: 'alice@example.com' });

// Create with factory traits
const adminUser = appSchema.users.create({ name: 'Admin' }, 'admin');

// Create multiple records
const users = appSchema.users.createMany(3);

// Find or create by attributes
const user = appSchema.users.findOrCreateBy(
  { email: 'alice@example.com' },
  { name: 'Alice', role: 'user' }
);

// Find many or create by attributes
const users = appSchema.users.findManyOrCreateBy(
  5,
  { role: 'user' },
  { isActive: true }
);

// Query - find by ID
const user = appSchema.users.find('1');

// Query - find with conditions
const admin = appSchema.users.find({ where: { role: 'admin' } });

// Query - find many by IDs
const users = appSchema.users.findMany(['1', '2', '3']);

// Query - find with predicate function
const activeUsers = appSchema.users.findMany({ 
  where: (user) => user.isActive && user.role === 'admin'
});

// Query - get all records
const allUsers = appSchema.users.all();

// Query - get first/last record
const first = appSchema.users.first();
const last = appSchema.users.last();

// Query - get by index
const thirdUser = appSchema.users.at(2);

// Update a record
user.update({ name: 'Bob', role: 'admin' });

// Delete a record
user.destroy();

// Delete by ID
appSchema.users.delete('1');

// Delete multiple records
appSchema.users.deleteMany(['1', '2', '3']);
```

**Improved Naming Conventions** 🎯

Unlike MirageJS's inconsistent method naming, MirageJS ORM introduces clear, predictable conventions:

**Collection Methods:**
- ✅ **Singular/Plural Pattern** - `create()` / `createMany()`, `find()` / `findMany()`, `delete()` / `deleteMany()`
- ✅ **Consistent Query API** - `find({ where })` replaces `find()`, `findBy()`, and `where()`
- ✅ **Explicit Intent** - `findOrCreateBy()` / `findManyOrCreateBy()` clearly express their purpose

**Before (MirageJS):** `create`, `createList`, `find`, `findBy`, `where`, `findOrCreateBy`  
**After (MirageJS ORM):** `create`, `createMany`, `find({ where })`, `findMany({ where })`, `findOrCreateBy`, `findManyOrCreateBy`

This consistency makes the API more intuitive and easier to learn!

### 3. Records vs Models

Understanding the distinction between **Records** and **Models** is fundamental to working with miragejs-orm:

**Records** are plain JavaScript objects stored in the database (`DbCollection`). They contain:
- Simple data attributes (name, email, etc.)
- Foreign keys (userId, postIds, etc.)
- An `id` field
- No methods or behavior

**Models** are class instances that wrap records and provide rich functionality:
- All record attributes via accessors (`user.name`, `post.title`)
- Relationship accessors (`user.posts`, `post.author`)
- CRUD methods (`.save()`, `.update()`, `.destroy()`, `.reload()`)
- Relationship methods (`.related()`, `.link()`, `.unlink()`)
- Serialization (`.toJSON()`, `.toString()`)
- Status tracking (`.isNew()`, `.isSaved()`)

```typescript
// When you create a model, it materializes into a Model instance
const user = appSchema.users.create({ name: 'Alice', email: 'alice@example.com' });

// The Model instance wraps a Record stored in the database
console.log(user instanceof Model); // true
console.log(user.name); // 'Alice' - attribute accessor
console.log(user.posts); // ModelCollection - relationship accessor

// Under the hood, the record is just:
// { id: '1', name: 'Alice', email: 'alice@example.com', postIds: [] }

// Models are materialized when:
// - Creating: appSchema.users.create(...)
// - Finding: appSchema.users.find('1')
// - Querying: appSchema.users.findMany({ where: ... })
// - Accessing relationships: user.posts (returns ModelCollection of Models)
```

**Why This Matters:**
- 🗄️ **Storage Efficiency** - The database stores lightweight records, not heavy model instances
- 🔄 **Fresh Data** - Each query materializes new model instances with the latest record data
- 🎯 **Type Safety** - Models provide type-safe accessors and methods, records are just data
- 🔗 **Relationships** - Models handle relationship logic, records only store foreign keys

### 4. Relationships

Define relationships between models to create a relational data structure using **Associations**.

**Associations** are a set of utilities responsible for managing relationships between models. They work in two contexts:
- **Collection relationships** - Define how models relate to each other in your schema
- **Factory associations** - Automatically create or link related records when generating test data

```typescript
import { associations } from 'miragejs-orm';
```

#### HasMany Relationship

Use `associations.hasMany()` to define a one-to-many relationship where a model has multiple related records.

```typescript
// In users collection - define the relationship
relationships: {
  posts: associations.hasMany(postModel)
}

// Usage - access related records
const post = appSchema.posts.create({ title: 'Hello' });
const user = appSchema.users.create({ name: 'Alice', posts: [post] });

console.log(user.posts); // ModelCollection with the post
console.log(user.posts.length); // 1
```

#### BelongsTo Relationship

Use `associations.belongsTo()` to define a many-to-one relationship where a model belongs to another model.

```typescript
// In posts collection - define the relationship
relationships: {
  author: associations.belongsTo(userModel, { foreignKey: 'authorId' })
}

// Usage - access the parent record
const post = appSchema.posts.find('1');
console.log(post.author.name); // Access related user
console.log(post.authorId); // The foreign key value
```

#### Many-to-Many Relationships

For many-to-many relationships, use `associations.hasMany()` on both sides with array foreign keys.

```typescript
import { model, schema, collection, associations } from 'miragejs-orm';

const studentModel = model('student', 'students')
  .attrs<{ name: string; courseIds: string[] }>()
  .create();

const courseModel = model('course', 'courses')
  .attrs<{ title: string; studentIds: string[] }>()
  .create();

const appSchema = schema()
  .collections({
    students: collection()
      .model(studentModel)
      .relationships({
        courses: associations.hasMany(courseModel, { 
          foreignKey: 'courseIds'
        }),
      })
      .create(),
    
    courses: collection()
      .model(courseModel)
      .relationships({
        students: associations.hasMany(studentModel, { 
          foreignKey: 'studentIds'
        }),
      })
      .create(),
  })
  .setup();

// Usage - bidirectional access
const student = appSchema.students.create({ 
  name: 'Alice',
  courseIds: ['1', '2']
});
console.log(student.courses.length); // 2
```

### 5. Factories

Factories help you generate realistic test data with minimal boilerplate.

#### Basic Factory

```typescript
import { factory } from 'miragejs-orm';
import { faker } from '@faker-js/faker';

const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => faker.person.fullName(),
    email: () => faker.internet.email(),
    role: () => 'user',  // Static default
  })
  .create();
```

#### Traits

Traits allow you to create variations of your factory:

```typescript
import { factory, associations } from 'miragejs-orm';
import { faker } from '@faker-js/faker';

const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => faker.person.fullName(),
    email: () => faker.internet.email(),
    role: () => 'user',
  })
  .traits({
    admin: {
      role: 'admin',
    },
    verified: {
      emailVerified: true,
      afterCreate: (model) => {
        // Custom logic after creation
        model.update({ verifiedAt: new Date().toISOString() })
      },
    },
    withPosts: {
      posts: associations.createMany(postModel, 3),
    },
  })
  .create();

// Usage
appSchema.users.create();  // Regular user
appSchema.users.create('admin');  // Admin user
appSchema.users.create('admin', 'verified');  // Admin + verified
appSchema.users.create('withPosts');  // User with 3 posts
```

#### Factory Associations

Create related models automatically:

```typescript
import { factory, associations } from 'miragejs-orm';

const userFactory = factory()
  .model(userModel)
  .associations({
    posts: associations.createMany(postModel, 3),
  })
  .traits({
    withProfile: {
      profile: associations.create(profileModel),
    },
  })
  .create();

// Link to existing models (or create if missing)
const userFactory2 = factory()
  .model(userModel)
  .traits({
    withExistingPost: {
      post: associations.link(postModel),  // Finds first existing post, creates one if none exist
    },
    withExistingPosts: {
      posts: associations.linkMany(postModel, 3),  // Finds/creates up to 3 posts
    },
  })
  .create();
```

#### Lifecycle Hooks

Execute logic after model creation:

```typescript
import { factory } from 'miragejs-orm';
import { faker } from '@faker-js/faker';

const postFactory = factory()
  .model(postModel)
  .attrs({
    title: () => faker.lorem.sentence(),
    content: () => faker.lorem.paragraphs(),
  })
  .afterCreate((post, schema) => {
    // Automatically assign to first user
    const user = schema.users.first();
    if (user) {
      post.update({ author: user });
    }
  })
  .create();
```

### 6. Schema

The schema is your in-memory database that ties everything together.

```typescript
import { schema } from 'miragejs-orm';

const appSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
    comments: commentCollection,
  })
  .setup();

// Now you can use all collections
appSchema.users.create({ name: 'Alice' });
appSchema.posts.all();
```

#### Fixtures

Load initial data from fixtures. Fixtures are defined at the **collection level** and support a `strategy` option to control when they're loaded:
- `'manual'` (default) - Load fixtures manually by calling `loadFixtures()`
- `'auto'` - Load fixtures automatically during schema setup

```typescript
import { schema, collection } from 'miragejs-orm';

// Manual loading (default)
const appSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .fixtures([
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ])
      .create(),
  })
  .setup();

// Load fixtures manually when needed
appSchema.loadFixtures(); // Loads all collection fixtures
appSchema.users.loadFixtures(); // Or load for specific collection

// Automatic loading with strategy option
const autoSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .fixtures(
        [
          { id: '1', name: 'Alice', email: 'alice@example.com' },
          { id: '2', name: 'Bob', email: 'bob@example.com' },
        ],
        { strategy: 'auto' } // Fixtures load automatically during setup
      )
      .create(),
  })
  .setup(); // Fixtures are already loaded!
```

#### Seeds

Define seed scenarios at the collection level for different testing contexts:

```typescript
import { collection, schema } from 'miragejs-orm';
import { faker } from '@faker-js/faker';

// Define seeds in the collection builder
const userCollection = collection()
  .model(userModel)
  .factory(userFactory)
  .seeds({
    userForm: (schema) => {
      // Create a user with all fields populated for form testing
      schema.users.create({
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        bio: 'Software developer with 10 years of experience',
        avatar: 'https://i.pravatar.cc/150?img=12',
        isActive: true,
        createdAt: new Date('2024-01-15').toISOString(),
      });
    },
    
    adminUser: (schema) => {
      // Create admin user for permission testing
      schema.users.create({
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      });
    },
  })
  .create();

const postCollection = collection()
  .model(postModel)
  .factory(postFactory)
  .seeds({
    postAuthor: (schema) => {
      // Create posts and assign a user to a random subset
      schema.posts.createMany(20);
      const user = schema.users.create({ name: 'Alice Author', email: 'alice@example.com' });
      
      // Assign user to random 5 posts
      const allPosts = schema.posts.all().models;
      const randomPosts = faker.helpers.arrayElements(allPosts, 5);
      
      randomPosts.forEach(post => {
        post.update({ author: user });
      });
    },
  })
  .create();

const appSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
  })
  .setup();

// Load all seeds for all collections
appSchema.loadSeeds();

// Or load seeds for a specific collection
appSchema.users.loadSeeds();

// Or load a specific scenario for a collection
appSchema.users.loadSeeds('userForm');
appSchema.posts.loadSeeds('postAuthor');
```

### 7. Serializers

Control how your models are formatted when converted to JSON. Serializers can be configured at three levels: using the Serializer class, collection-level options, or global schema options.

#### Using Serializer Class (Full Control)

```typescript
import { model, collection, schema, Serializer } from 'miragejs-orm';

// 1. Define your model template
interface UserAttrs {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

const userModel = model('user', 'users')
  .attrs<UserAttrs>()
  .create();

// 2. Define your JSON output structure
interface UserJSON {
  id: string;
  name: string;
  email: string;
  // Note: 'password' and 'role' fields are excluded
}

// 3. Create a serializer
const userSerializer = new Serializer<typeof userModel, UserJSON>(userModel, {
  attrs: ['id', 'name', 'email'],  // Include only these attributes
  root: true,  // Wrap in { user: {...} }
  embed: true,  // Include relationships
  include: ['posts'],  // Include posts relationship
});

// 4. Use in collection
const appSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .serializer(userSerializer)
      .create(),
  })
  .setup();

// 5. Serialize with type safety
const user = appSchema.users.create({ 
  name: 'Alice',
  email: 'alice@example.com',
  password: 'secret123',
  role: 'admin'
});

const json = user.toJSON<UserJSON>();
// {
//   user: {
//     id: '1',
//     name: 'Alice',
//     email: 'alice@example.com',
//     posts: [...]  // If embed: true
//   }
// }
```

#### Collection-Level Serializer Options

You can pass serializer options directly to the collection without creating a Serializer instance:

```typescript
import { model, collection, schema } from 'miragejs-orm';

const appSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .serializer({
        attrs: ['id', 'name', 'email'],  // Filter attributes
        root: 'userData',  // Custom root key
        embed: false,  // Don't include relationships
      })
      .create(),
  })
  .setup();

const user = appSchema.users.create({ 
  name: 'Bob',
  email: 'bob@example.com',
  password: 'secret'
});

console.log(user.toJSON());
// {
//   userData: {
//     id: '1',
//     name: 'Bob',
//     email: 'bob@example.com'
//   }
// }
```

#### Global Schema Serializer Options

Apply serializer configuration to all collections in your schema:

```typescript
import { model, collection, schema } from 'miragejs-orm';

const appSchema = schema()
  .collections({
    users: collection().model(userModel).create(),
    posts: collection().model(postModel).create(),
  })
  .serializer({
    root: true,  // All models will wrap in their model name
    embed: true,  // All models will include relationships
  })
  .setup();

const user = appSchema.users.create({ name: 'Alice', email: 'alice@example.com' });
const post = appSchema.posts.create({ title: 'Hello', content: 'World' });

console.log(user.toJSON());
// { user: { id: '1', name: 'Alice', email: 'alice@example.com' } }

console.log(post.toJSON());
// { post: { id: '1', title: 'Hello', content: 'World' } }
```

**Serializer Options:**

- `attrs`: Array of attribute names to include (default: all) - *Collection-level only*
- `root`: Wrap response in root key (boolean or string) - *Available at all levels*
- `embed`: Include relationships inline (default: false) - *Available at all levels*
- `include`: Array of relationship names to include - *Collection-level only*

**Note:** Collection-level options override global schema options.

---

<div align="center">

## 🎯 Usage Examples

</div>

### With MSW (Mock Service Worker)

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { schema, model, collection, factory } from 'miragejs-orm';

// Setup your schema
const appSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .factory(userFactory)
      .create(),
  })
  .setup();

// Seed data
appSchema.users.createMany(10);

// Create MSW handlers
const handlers = [
  http.get('/api/users', () => {
    const users = appSchema.users.all();
    return HttpResponse.json({ users: users.toJSON() });
  }),
  
  http.get('/api/users/:id', ({ params }) => {
    const user = appSchema.users.find(params.id as string);
    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(user.toJSON());
  }),
  
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    const user = appSchema.users.create(body);
    return HttpResponse.json(user.toJSON(), { status: 201 });
  }),
];

const server = setupServer(...handlers);
```

### In Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('User Management', () => {
  afterEach(() => {
    // Reset database after each test
    appSchema.db.emptyData();
  });

  it('should create a user with posts', () => {
    const user = appSchema.users.create({
      name: 'Alice',
      email: 'alice@example.com',
    });
    
    appSchema.posts.createMany(3, { authorId: user.id });
    
    expect(user.posts.length).toBe(3);
    expect(user.posts.models[0].author.id).toBe(user.id);
  });
  
  it('should handle complex relationships', () => {
    const user1 = appSchema.users.create({ name: 'Alice' });
    const user2 = appSchema.users.create({ name: 'Bob' });
    
    const post = appSchema.posts.create({
      title: 'Hello',
      authorId: user1.id,
    });
    
    appSchema.comments.create({
      content: 'Great post!',
      postId: post.id,
      userId: user2.id,
    });
    
    expect(post.comments.length).toBe(1);
    expect(post.comments.models[0].user.name).toBe('Bob');
  });
});
```

### In Storybook

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { UserList } from './UserList';
import { schema, model, collection, factory } from 'miragejs-orm';

// Setup mock data for stories
const setupMockData = (count: number) => {
  const appSchema = schema()
    .collections({
      users: collection()
        .model(userModel)
        .factory(userFactory)
        .create(),
    })
    .setup();
  
  return appSchema.users.createMany(count);
};

const meta: Meta<typeof UserList> = {
  component: UserList,
  title: 'UserList',
};

export default meta;

export const Empty: StoryObj<typeof UserList> = {
  render: () => <UserList users={[]} />,
};

export const WithUsers: StoryObj<typeof UserList> = {
  render: () => {
    const users = setupMockData(5);
    return <UserList users={users.toJSON()} />;
  },
};

export const WithManyUsers: StoryObj<typeof UserList> = {
  render: () => {
    const users = setupMockData(50);
    return <UserList users={users.toJSON()} />;
  },
};
```

---

<div align="center">

## 🔧 Advanced Features

</div>

### Custom Identity Managers

Control how IDs are generated:

```typescript
import { schema, StringIdentityManager, NumberIdentityManager, type IdentityManager } from 'miragejs-orm';

// Use number IDs instead of strings
const appSchema = schema({ identityManager: new NumberIdentityManager() })
  .collections({ users: userCollection })
  .setup();

const user = appSchema.users.create({ name: 'Alice' });
console.log(user.id); // 1 (number, not string)

// Create custom identity manager
class UUIDIdentityManager implements IdentityManager {
  fetch(): string {
    return crypto.randomUUID();
  }
  
  set(id: string): void {
    // No-op for UUIDs
  }
  
  reset(): void {
    // No-op for UUIDs
  }
}

const appSchema = schema({ identityManager: new UUIDIdentityManager() })
  .collections({ users: userCollection })
  .setup();
```

### Query Methods

MirageJS ORM provides powerful query capabilities including advanced operators, logical combinations, and pagination — features not available in standard MirageJS.

#### Basic Queries

```typescript
// Simple equality
const admins = appSchema.users.findMany({ where: { role: 'admin' } });

// Predicate function
const recentPosts = appSchema.posts.findMany({ 
  where: (post) => new Date(post.createdAt) > new Date('2024-01-01')
});
```

#### Advanced Query Operators

```typescript
// Comparison operators
const youngUsers = appSchema.users.findMany({ 
  where: { age: { lt: 30 } }  // Less than
});

const adults = appSchema.users.findMany({ 
  where: { age: { gte: 18 } }  // Greater than or equal
});

const rangeUsers = appSchema.users.findMany({ 
  where: { age: { between: [25, 35] } }  // Between (inclusive)
});

// String operators
const gmailUsers = appSchema.users.findMany({ 
  where: { email: { like: '%@gmail.com' } }  // SQL-style wildcards
});

const nameSearch = appSchema.users.findMany({ 
  where: { name: { ilike: '%john%' } }  // Case-insensitive search
});

const usersStartingWithA = appSchema.users.findMany({ 
  where: { name: { startsWith: 'A' } }
});

// Null checks
const usersWithoutEmail = appSchema.users.findMany({ 
  where: { email: { isNull: true } }
});

// Array operators
const admins = appSchema.users.findMany({ 
  where: { tags: { contains: 'admin' } }  // Array includes value
});

const multipleRoles = appSchema.users.findMany({ 
  where: { tags: { contains: ['admin', 'moderator'] } }  // Array includes all values
});
```

**Available Operators:**
- Equality: `eq`, `ne`, `in`, `nin`, `isNull`
- Comparison: `lt`, `lte`, `gt`, `gte`, `between`
- String: `like`, `ilike`, `startsWith`, `endsWith`, `contains`
- Array: `contains`, `length`

#### Logical Operators (AND/OR/NOT)

```typescript
// AND - all conditions must match
const activeAdmins = appSchema.users.findMany({ 
  where: { 
    AND: [
      { status: 'active' },
      { role: 'admin' }
    ]
  }
});

// OR - at least one condition must match
const flaggedUsers = appSchema.users.findMany({ 
  where: { 
    OR: [
      { status: 'suspended' },
      { age: { lt: 18 } }
    ]
  }
});

// NOT - negate condition
const nonAdmins = appSchema.users.findMany({ 
  where: { 
    NOT: { role: 'admin' }
  }
});

// Complex combinations
const eligibleUsers = appSchema.users.findMany({ 
  where: { 
    AND: [
      {
        OR: [
          { status: 'active' },
          { status: 'pending' }
        ]
      },
      { NOT: { age: { lt: 18 } } },
      { email: { like: '%@company.com' } }
    ]
  }
});
```

#### Pagination

**Offset-based (Standard)**

```typescript
// Page 1: First 10 users
const page1 = appSchema.users.findMany({ 
  limit: 10,
  offset: 0
});

// Page 2: Next 10 users
const page2 = appSchema.users.findMany({ 
  limit: 10,
  offset: 10
});

// Combined with filtering and sorting
const activeUsersPage2 = appSchema.users.findMany({ 
  where: { status: 'active' },
  orderBy: { createdAt: 'desc' },
  offset: 20,
  limit: 10
});
```

**Cursor-based (Keyset) Pagination**

More efficient for large datasets and prevents inconsistencies when data changes between requests.

```typescript
// First page
const firstPage = appSchema.users.findMany({ 
  orderBy: { createdAt: 'desc' },
  limit: 10
});

// Next page using last item as cursor
const lastUser = firstPage[firstPage.length - 1];
const nextPage = appSchema.users.findMany({ 
  orderBy: { createdAt: 'desc' },
  cursor: { createdAt: lastUser.createdAt },
  limit: 10
});

// Multi-field cursor for unique sorting
const page = appSchema.users.findMany({ 
  orderBy: [
    ['score', 'desc'],
    ['createdAt', 'asc']
  ],
  cursor: { score: 100, createdAt: new Date('2024-01-15') },
  limit: 20
});
```

#### Combined Operations

```typescript
// Complex query with all features
const results = appSchema.users.findMany({ 
  where: { 
    AND: [
      { status: 'active' },
      { 
        OR: [
          { role: 'admin' },
          { tags: { contains: 'premium' } }
        ]
      },
      { age: { gte: 18 } }
    ]
  },
  orderBy: [
    ['lastActive', 'desc'],
    ['name', 'asc']
  ],
  offset: 20,
  limit: 10
});
```

### Direct Database Access

For low-level operations:

```typescript
// Access raw database
const rawUsers = appSchema.db.users.all();

// Batch operations
appSchema.db.emptyData();  // Clear all data
appSchema.db.users.insert({ id: '1', name: 'Alice' });
appSchema.db.users.remove({ id: '1' });
```

### Debugging

Enable logging to understand what the ORM is doing under the hood. This is invaluable for debugging tests, understanding query behavior, and troubleshooting data issues.

**Enable Logging:**

```typescript
import { schema } from 'miragejs-orm';

const appSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
  })
  .logging({ 
    enabled: true, 
    level: 'debug' 
  })
  .setup();
```

**Log Levels:**

```typescript
// Debug - Most verbose, shows all operations
schema().logging({ enabled: true, level: 'debug' })
// Output: Schema initialization, collection registration, create/find operations, query details

// Info - Important operations and results
schema().logging({ enabled: true, level: 'info' })
// Output: Fixtures loaded, seeds loaded, high-level operations

// Warn - Potential issues and unusual patterns
schema().logging({ enabled: true, level: 'warn' })
// Output: Foreign key mismatches, deprecated usage

// Error - Only failures and validation errors
schema().logging({ enabled: true, level: 'error' })
// Output: Operation failures, validation errors

// Silent - No logging (default)
schema().logging({ enabled: true, level: 'silent' })
```

**Custom Prefix:**

```typescript
import { schema } from 'miragejs-orm';

const testSchema = schema()
  .collections({ users: userCollection })
  .logging({ 
    enabled: true, 
    level: 'debug',
    prefix: '[MyApp Test]'  // Custom prefix instead of default '[Mirage]'
  })
  .setup();

// Output: [MyApp Test] DEBUG: Schema initialized
```

**What Gets Logged:**

```typescript
import { schema, collection } from 'miragejs-orm';

const appSchema = schema()
  .logging({ enabled: true, level: 'debug' })
  .collections({
    users: collection()
      .model(userModel)
      .factory(userFactory)
      .fixtures([{ id: '1', name: 'Alice' }])
      .seeds({ testData: (schema) => schema.users.create({ name: 'Bob' }) })
      .create(),
  })
  .setup();

// Console output:
// [Mirage] DEBUG: Registering collections { count: 1, names: ['users'] }
// [Mirage] DEBUG: Collection 'users' initialized { modelName: 'user' }
// [Mirage] DEBUG: Schema initialized { collections: ['users'] }

// Load fixtures
appSchema.loadFixtures();
// [Mirage] INFO: Fixtures loaded successfully for 'users' { count: 1 }

// Create a record
appSchema.users.create({ name: 'Charlie' });
// [Mirage] DEBUG: Creating user { collection: 'users' }
// [Mirage] DEBUG: Created user with factory { collection: 'users', id: '2' }

// Query records
const users = appSchema.users.findMany({ where: { name: 'Charlie' } });
// [Mirage] DEBUG: Query 'users': findMany
// [Mirage] DEBUG: Query 'users' returned 1 records

// Load seeds for a specific scenario
appSchema.users.loadSeeds('testData');
// [Mirage] INFO: Seeds loaded successfully for 'users' { scenario: 'testData' }
```

**Use Cases:**

```typescript
import { schema } from 'miragejs-orm';

// Development - See what's happening
const devSchema = schema()
  .collections({ users: userCollection })
  .logging({ enabled: true, level: 'info' })
  .setup();

// Testing - Debug failing tests
const testSchema = schema()
  .collections({ users: userCollection })
  .logging({
    enabled: process.env.DEBUG === 'true',  // Enable via env var
    level: 'debug' 
  })
  .setup();
```

---

<div align="center">

## 💡 TypeScript Best Practices

</div>

MirageJS ORM is built with TypeScript-first design. Here are best practices for getting the most out of type safety.

### Defining Shareable Model Types

Use `typeof` to create reusable model types:

```typescript
// -- @test/schema/models/user.model.ts --
import { model } from 'miragejs-orm';
import type { User } from '@domain/users/types';

// Define user model attributes type
export type UserAttrs = { name: string; email: string; role: string };
// Define user model output type to be produced during serialization
export type UserJSON = { user: User; current?: boolean };

// Create user model template
export const userModel = model('user', 'users')
  .attrs<UserAttrs>()
  .json<UserJSON, User[]>()
  .create();

// Define a shareable user model type
export type UserModel = typeof userModel;
```

```typescript
// -- @test/schema/models/post.model.ts --
import { model } from 'miragejs-orm';
import type { Post } from '@domain/posts/types';

// Define post attributes type
export type PostAttrs = { title: string; content: string; authorId: string };

// Create post model template
export const postModel = model('post', 'posts')
  .attrs<PostAttrs>()
  .json<Post, Post[]>() // Use existing Post entity type without transformations
  .create();

// Define shareable post model type
export type PostModel = typeof postModel;
```

```typescript
// -- @test/schema/collections/user.collection.ts --
// Use shareable model types in your collections
import { userModel, type UserModel, postModel, type PostModel } from '@test/schema/models';
```

### Typing Schema

Define explicit schema types for use across your application:

```typescript
// -- @test/schema/types.ts --
import { model, collection, schema, associations } from 'miragejs-orm';
import type { CollectionConfig, HasMany, BelongsTo, SchemaInstance } from 'miragejs-orm';
import type { UserModel, PostModel } from './models';

// Define your schema collections type
export type AppCollections = {
  users: CollectionConfig<
    UserModel,
    {
      posts: HasMany<PostModel>;
    },
    Factory<
      UserModel,
      AppCollections,
      {
        admin: TraitDefinition<AppCollections, UserModel>;
      }
    >
  >;
  posts: CollectionConfig<
    PostModel,
    {
      author: BelongsTo<UserModel, 'authorId'>
    },
    Factory<
      UserModel,
      AppCollections,
      {
        admin: TraitDefinition<AppCollections, UserModel>;
      }
    >
  >;
};

export type AppSchema = SchemaInstance<AppCollections>;

```

### Typing Collections

Pass schema type to collections for type-safe `schema` usage and data validation (e.g., seeds, fixtures, etc.):

```typescript
// -- @test/schema/collections/user.collection.ts --
import { model, collection, schema, associations } from 'miragejs-orm';
import { userModel, postModel } from '@test/schema/models';
import type { AppCollections } from '@test/schema/types';

// Create user collection
const userCollection = collection<AppCollections>() // Typing collection isn't necessary...
  .model(userModel)
  .relationships({
    posts: associations.hasMany(postModel),
  })
  .seeds({ // ...until you need to use typed schema with IDE autocomplete support
    testUsers: (schema) => {
      schema.users.create({ name: 'John', email: 'john@example.com' });
      schema.users.create({ name: 'Jane', email: 'jane@example.com' });
    },
  })
  .create();
```

### Typing Factories

Pass schema type to factories for type-safe `associations` and `afterCreate` hooks:

```typescript
import { factory, associations } from 'miragejs-orm';
import { userModel, postModel } from '@test/schema/models';
import type { AppCollections } from '@test/schema/types';

export const postFactory = factory<AppCollections>()
  .model(postModel)
  .attrs({
    title: () => 'Sample Post',
    content: () => 'Content here',
  })
  .associations({
    // Types enable autocomplete - IDE suggests 'posts' as a relationship
    posts: associations.createMany<AppCollections>(postModel, 3, 'published'), // ...and post model attributes or traits
  })
  .afterCreate((post, schema) => {
    // schema is fully typed! IDE autocomplete works perfectly
    const user = schema.users.first();
    if (user) {
      post.update({ author: user });
    }
  })
  .create();
```

**Key Benefits:**
- ✅ Full IDE autocomplete and IntelliSense
- ✅ Type-safe relationship definitions
- ✅ Catch errors at compile time
- ✅ Refactor with confidence

---

<div align="center">

## 🧩 Modular Architecture

</div>

MirageJS ORM is **fully modular** — all components can be created separately and combined in your schema. This provides maximum flexibility for different environments and scenarios.

### Recommended Project Structure

```typescript
// schema/models - Centralized model templates

// schema/models/user.model.ts
export const userModel = model('user', 'users')
  .attrs<UserAttrs>()
  .create();

// schema/models/post.model.ts
export const postModel = model('post', 'posts')
  .attrs<PostAttrs>()
  .create();

// schema/collections/users - Collection-specific components

// schema/collections/users/user.factory.ts - Factory for creating user instances
import { factory } from 'miragejs-orm';
import { userModel } from '@test/schema/models';

export const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => 'John Doe',
    email: () => 'john@example.com',
    role: () => 'user',
  })
  .create();

// schema/collections/users/user.collection.ts - Collection configuration with relationships
import { collection, associations } from 'miragejs-orm';
import type { AppCollections } from '@test/schema/types';
import { userModel, postModel } from '@test/schema/models';
import { userFactory } from './user.factory';
import { userSeeds } from './user.seeds';

export const userCollection = collection<AppCollections>()
  .model(userModel)
  .factory(userFactory)
  .relationships({
    posts: associations.hasMany(postModel),
  })
  .seeds(userSeeds)
  .create();

// schema/collections/users/user.seeds.ts - Seed scenarios for different contexts
import type { SeedFunction } from 'miragejs-orm';
import type { AppCollections } from '@test/schema/types';

export const userSeeds: SeedFunction<AppCollections> = {
  current(schema) {
    schema.users.create({ name: 'Default User', current: true });
  },
  admin(schema) {
    schema.users.create({ name: 'Admin', role: 'admin' });
  },
};

// schema/types.ts - Centralized type definitions
import type { CollectionConfig } from 'miragejs-orm';
import type { UserModel, PostModel } from './models';

export type AppCollections = {
  users: CollectionConfig<UserModel>;
  posts: CollectionConfig<PostModel>;
};

// schema/app.schema.ts - Main application schema
import { schema } from 'miragejs-orm';
import { userCollection, postCollection } from './collections';

export const appSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
  })
  .setup();

// schema/variations/dev.schema.ts - Development schema with seeds
import { schema } from 'miragejs-orm';
import { userCollection, postCollection } from '@test/schema/collections';

export const devSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
  })
  .serializer({ root: true, embed: true })
  .setup();

devSchema.loadSeeds();

// schema/variations/test.schema.ts - Testing schema with fixtures
import { schema, collection } from 'miragejs-orm';
import { userModel } from '@test/schema/models';

export const testSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .fixtures([
        { id: '1', name: 'Test User', email: 'test@example.com' },
      ])
      .create(),
  })
  .setup();

testSchema.loadFixtures();
```

### Folder Structure Overview

```
schema/
├── models/                   # Shared model templates
│   ├── user.model.ts          # Exports: userModel, UserModel type
│   ├── post.model.ts          # Exports: postModel, PostModel type
│   └── index.ts               # Re-export all models
│
├── collections/              # Collection-specific modules
│   ├── users/
│   │   ├── user.factory.ts    # User factory with traits
│   │   ├── user.seeds.ts      # User seed scenarios
│   │   └── user.collection.ts # Complete user collection
│   │
│   └── posts/
│       ├── post.factory.ts
│       ├── post.seeds.ts
│       └── post.collection.ts
│
├── types.ts                  # Centralized AppCollections type
├── schema.ts                 # Main application schema
│
└── variations/              # Environment-specific schemas (optional)
    ├── dev.schema.ts         # Development with seeds
    ├── test.schema.ts        # Testing with fixtures
    └── storybook.schema.ts   # Storybook-specific setup
```

**Benefits of This Structure:**
- 🗂️ **Centralized Models** - Easy to find and import from one location
- 📦 **Self-Contained Collections** - Everything related to a collection lives in one folder
- 🔄 **Co-located Types** - `UserModel` type lives alongside `userModel` template
- 🎯 **Environment Variations** - Multiple schemas for different environments without duplication
- 🚫 **No Circular Dependencies** - Clear one-way flow: `models → collections → schemas`

**Why This Works:**
1. **Models** are completely independent — no imports from other modules
2. **Factories** only import models
3. **Seeds** only import types (not model instances)
4. **Collections** import models, factories, and seeds from their own directory
5. **Schemas** import collections and compose them into the final schema

## 📖 API Reference

**Full Documentation Website Coming Soon!** 🚀

We're working on a comprehensive documentation website with detailed API references, interactive examples, and guides. Stay tuned!

In the meantime:
- **TypeScript Definitions**: See the [TypeScript definitions](./lib/dist/index.d.ts) for complete API signatures
- **IDE Autocomplete**: The library is fully typed—your IDE will provide inline documentation and type hints
- **This README**: Contains extensive examples covering most use cases

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

---

## 📄 License

MIT © [MirageJS](LICENSE)

---

**Built with ❤️ for frontend developers who want to move fast without breaking things.**
