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

### 1. Models (Model Templates)

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
// Create single record
const user = appSchema.users.create({ name: 'Alice', email: 'alice@example.com' });

// Create multiple records
const users = appSchema.users.createList([
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', email: 'charlie@example.com' }
]);

// Create with factory traits
const adminUser = appSchema.users.create('admin');

// Find or create by attributes
const user = appSchema.users.findOrCreateBy(
  { email: 'alice@example.com' },
  { name: 'Alice', role: 'user' }
);

// Query - find by ID
const user = appSchema.users.find('1');

// Query - find with conditions
const admins = appSchema.users.find({ where: { role: 'admin' } });

// Query - find with predicate function
const activeUsers = appSchema.users.find({ 
  where: (user) => user.isActive && user.role === 'admin'
});

// Query - find many by IDs
const users = appSchema.users.findMany(['1', '2', '3']);

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

### 3. Relationships

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

### 4. Factories

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
  .traits({
    withPosts: {
      posts: associations.createMany(postModel, 3),
    },
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
      posts: associations.link(postModel),  // Finds first existing post, creates one if none exist
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

### 5. Schema

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

Define scenarios for different contexts:

```typescript
import { schema } from 'miragejs-orm';
import { faker } from '@faker-js/faker';

const appSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
  })
  .seeds({
    default: (schema) => {
      schema.users.create({ name: 'Default User' });
    },
    
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
  .setup();

// Load all seeds for all collections
appSchema.loadSeeds();

// Or load seeds for a specific collection
appSchema.users.loadSeeds();

// Or load seeds for a specific scenario
appSchema.users.loadSeeds('userForm');

```

### 6. Serializers

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
const admins = appSchema.users.find({ where: { role: 'admin' } });

// Predicate function
const recentPosts = appSchema.posts.find({ 
  where: (post) => new Date(post.createdAt) > new Date('2024-01-01')
});
```

#### Advanced Query Operators

```typescript
// Comparison operators
const youngUsers = appSchema.users.find({ 
  where: { age: { lt: 30 } }  // Less than
});

const adults = appSchema.users.find({ 
  where: { age: { gte: 18 } }  // Greater than or equal
});

const rangeUsers = appSchema.users.find({ 
  where: { age: { between: [25, 35] } }  // Between (inclusive)
});

// String operators
const gmailUsers = appSchema.users.find({ 
  where: { email: { like: '%@gmail.com' } }  // SQL-style wildcards
});

const nameSearch = appSchema.users.find({ 
  where: { name: { ilike: '%john%' } }  // Case-insensitive search
});

const usersStartingWithA = appSchema.users.find({ 
  where: { name: { startsWith: 'A' } }
});

// Null checks
const usersWithoutEmail = appSchema.users.find({ 
  where: { email: { isNull: true } }
});

// Array operators
const admins = appSchema.users.find({ 
  where: { tags: { contains: 'admin' } }  // Array includes value
});

const multipleRoles = appSchema.users.find({ 
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
const activeAdmins = appSchema.users.find({ 
  where: { 
    AND: [
      { status: 'active' },
      { role: 'admin' }
    ]
  }
});

// OR - at least one condition must match
const flaggedUsers = appSchema.users.find({ 
  where: { 
    OR: [
      { status: 'suspended' },
      { age: { lt: 18 } }
    ]
  }
});

// NOT - negate condition
const nonAdmins = appSchema.users.find({ 
  where: { 
    NOT: { role: 'admin' }
  }
});

// Complex combinations
const eligibleUsers = appSchema.users.find({ 
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
const page1 = appSchema.users.find({ 
  limit: 10,
  offset: 0
});

// Page 2: Next 10 users
const page2 = appSchema.users.find({ 
  limit: 10,
  offset: 10
});

// Combined with filtering and sorting
const activeUsersPage2 = appSchema.users.find({ 
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
const firstPage = appSchema.users.find({ 
  orderBy: { createdAt: 'desc' },
  limit: 10
});

// Next page using last item as cursor
const lastUser = firstPage[firstPage.length - 1];
const nextPage = appSchema.users.find({ 
  orderBy: { createdAt: 'desc' },
  cursor: { createdAt: lastUser.createdAt },
  limit: 10
});

// Multi-field cursor for unique sorting
const page = appSchema.users.find({ 
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
const results = appSchema.users.find({ 
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

---

<div align="center">

## 💡 TypeScript Best Practices

</div>

MirageJS ORM is built with TypeScript-first design. Here are best practices for getting the most out of type safety.

### Shareable Model Types

Use `typeof` to create reusable model types:

```typescript
import { model } from 'miragejs-orm';

// Define model template
export const userModel = model('user', 'users')
  .attrs<{ name: string; email: string; role: string }>()
  .create();

export const postModel = model('post', 'posts')
  .attrs<{ title: string; content: string; authorId: string }>()
  .create();

// Create shareable types
export type UserModel = typeof userModel;
export type PostModel = typeof postModel;

// Use in other files
import type { UserModel, PostModel } from './models';
```

### Typing Schema and Collections

Define explicit schema types for use across your application:

```typescript
import { model, collection, schema, associations } from 'miragejs-orm';
import type { CollectionConfig, SchemaCollections } from 'miragejs-orm';

// Define your models
export const userModel = model('user', 'users')
  .attrs<{ name: string; email: string }>()
  .create();

export const postModel = model('post', 'posts')
  .attrs<{ title: string; content: string; authorId: string }>()
  .create();

// Define schema collections type
export type AppSchemaCollections = {
  users: CollectionConfig<typeof userModel>;
  posts: CollectionConfig<typeof postModel>;
};

// Create your schema
export const appSchema = schema()
  .collections({
    users: collection<AppSchemaCollections>()
      .model(userModel)
      .relationships({
        posts: associations.hasMany(postModel),
      })
      .create(),
      
    posts: collection<AppSchemaCollections>()
      .model(postModel)
      .relationships({
        author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
      })
      .create(),
  })
  .setup();

// Export schema instance type
export type AppSchema = typeof appSchema;
```

### Typing Factory Hooks with Schema

Pass schema type to factories for type-safe `afterCreate` hooks:

```typescript
import { factory, associations } from 'miragejs-orm';
import type { AppSchemaCollections } from './schema';
import { userModel, postModel } from './models';

export const postFactory = factory<AppSchemaCollections>()
  .model(postModel)
  .attrs({
    title: () => 'Sample Post',
    content: () => 'Content here',
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

### Typing Associations for Autocomplete

Use model types to enable autocomplete in factory associations:

```typescript
import { factory, associations } from 'miragejs-orm';
import type { AppSchemaCollections } from './schema';
import { userModel, postModel } from './models';

export const userFactory = factory<AppSchemaCollections>()
  .model(userModel)
  .traits({
    withPosts: {
      // Types enable autocomplete - IDE suggests 'posts' as a relationship
      posts: associations.createMany(postModel, 3),
    },
    withLinkedPost: {
      // Autocomplete knows what associations are available
      posts: associations.link(postModel),
    },
  })
  .create();
```

### Typing Collection Seeds

Pass schema type to collections created separately for typed seeds:

```typescript
import { collection } from 'miragejs-orm';
import type { AppSchemaCollections } from './schema';
import { userModel } from './models';

export const userCollection = collection<AppSchemaCollections>()
  .model(userModel)
  .seeds({
    default: (schema) => {
      // schema is typed! Autocomplete shows schema.users, schema.posts, etc.
      schema.users.create({ name: 'Alice', email: 'alice@example.com' });
      
      // IDE knows about other collections
      const posts = schema.posts.all();
    },
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
// schema/models/user.model.ts
interface UserAttrs {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const userModel = model('user', 'users')
  .attrs<UserAttrs>()
  .create();

// Export shareable type
export type UserModel = typeof userModel;

// schema/models/post.model.ts
interface PostAttrs {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

interface PostJSON {
  id: string;
  title: string;
  content: string;
}

export const postModel = model('post', 'posts')
  .attrs<PostAttrs>()
  .json<PostJSON>()
  .create();

export type PostModel = typeof postModel;

// schema/collections/users/user.factory.ts
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

// schema/collections/users/user.seeds.ts
import type { SeedFunction } from 'miragejs-orm';
import type { AppSchemaCollections } from '@test/schema/types';

export const userSeeds: SeedFunction<AppSchemaCollections> = {
  default: (schema) => {
    schema.users.create({ name: 'Default User' });
  },
  admin: (schema) => {
    schema.users.create({ name: 'Admin', role: 'admin' });
  },
};

// schema/collections/users/user.collection.ts
import { collection, associations } from 'miragejs-orm';
import type { AppSchemaCollections } from '@test/schema/types';
import { userModel, postModel } from '@test/schema/models';
import { userFactory } from './user.factory';
import { userSeeds } from './user.seeds';

export const userCollection = collection<AppSchemaCollections>()
  .model(userModel)
  .factory(userFactory)
  .relationships({
    posts: associations.hasMany(postModel),
  })
  .seeds(userSeeds)
  .create();

// schema/types.ts - Centralized type definitions
import type { CollectionConfig } from 'miragejs-orm';
import type { userModel, postModel } from './models';

export type AppSchemaCollections = {
  users: CollectionConfig<typeof userModel>;
  posts: CollectionConfig<typeof postModel>;
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

export type AppSchema = typeof appSchema;

// schema/variations/dev.schema.ts - Development schema
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

// schema/variations/test.schema.ts - Testing schema
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
├── types.ts                  # Centralized AppSchemaCollections type
├── schema.ts                 # Main application schema
│
└── variations/              # Environment-specific schemas (optional)
    ├── dev.schema.ts         # Development with seeds
    ├── test.schema.ts        # Testing with fixtures
    └── storybook.schema.ts   # Storybook-specific setup
```

**Benefits of This Structure:**
- 🗂️ **Models are centralized** - Easy to find and import from one location
- 📦 **Collections are self-contained** - Everything related to a collection in one folder
- 🔄 **Type exports alongside templates** - `UserModel` type lives with `userModel`
- 🎯 **Schema variations** - Multiple schemas for different environments without duplication
- 🚫 **No circular dependencies** - Clear one-way flow: `models → collections → schemas`

**Why This Works:**
1. **Models** are completely independent - no imports from other modules
2. **Factories** only import models
3. **Seeds** only import types and models
4. **Collections** import models, factories, and seeds from their own directory
5. **Schemas** import collections and compose them

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
