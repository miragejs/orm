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

**miragejs-orm** is a complete TypeScript rewrite of the powerful ORM layer from MirageJS, designed to give frontend developers the freedom to quickly create type-safe mocks for both testing and development — without backend dependencies.

Build realistic, relational data models in memory with factories, traits, relationships, and serialization, all with **100% type safety** and a modern, fluent API.

---

## 🚀 Why Choose miragejs-orm?

### Compared to MirageJS

While MirageJS is an excellent solution for full API mocking, `miragejs-orm` takes the most powerful part - the ORM — and enhances it:

- **🎯 Fully Rewritten in TypeScript** - Built from the ground up with TypeScript, providing complete type safety and excellent IDE autocomplete
- **🪶 Zero Dependencies** - No external dependencies means smaller bundle size (~55KB) and no supply chain concerns
- **🔌 Framework Agnostic** - Use with any HTTP interceptor library (MSW, Mirage Server, Axios interceptors, etc.) or testing framework
- **⚡ Modern Fluent API** - Declarative builder patterns let you construct schemas, models, and factories with an intuitive, chainable API
- **📦 No Inflection Magic Under The Hood** - Now you control exactly how your model names and attributes are formatted - what you define is what you get
- **✅ Battle Tested** - 900+ test cases with 95% code coverage, including type tests, ensure reliability
- **🔧 Modern Tooling** - Built with modern build tools and package standards for optimal developer experience

### Key Benefits

- **Develop UI-First** - Don't wait for backend APIs. Build complete frontend features with realistic data
- **Flexible Data Modeling** - Create models that mirror your backend entities OR design custom models for specific endpoints
- **Built-in Serialization** - Transform your data on output with serializers to match API formats, hide sensitive fields, and control response structure
- **Type-Safe Mocking** - Full TypeScript support means your mocks stay in sync with your types
- **Testing & Development** - Perfect for unit tests, integration tests, Storybook stories, and development environments

**📂 Example project:** See the [task-board example](./examples/task-board) for a full reference: schema setup, models, collections, relations, factories, seeds, serializers, and MSW handlers. Use it to learn the library and as a pattern for your own projects.

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
import { model, schema, collection, factory, relations } from 'miragejs-orm';

// 1. Define your models
const userModel = model('user', 'users')
  .attrs<{ name: string; email: string }>()
  .build();

const postModel = model('post', 'posts')
  .attrs<{ title: string; content: string; authorId: string }>()
  .build();

// 2. Create factories with fake data
const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => 'John Doe',
    email: () => 'john@example.com',
  })
  .build();

// 3. Setup your schema with relationships
const testSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .factory(userFactory)
      .relationships({
        posts: relations.hasMany(postModel),
      })
      .build(),

    posts: collection()
      .model(postModel)
      .relationships({
        author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
      })
      .build(),
  })
  .build();

// 4. Use it!
const user = testSchema.users.create({ name: 'Alice' });

const post = testSchema.posts.create({
  title: 'Hello World',
  content: 'My first post',
  authorId: user.id,
});

console.log(user.posts.length); // 1
console.log(post.author.name); // 'Alice'
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
const userModel = model('user', 'users').attrs<UserAttrs>().build();

// This template can now be shared across collections and relationships
```

<details>
<summary><strong>Key points</strong></summary>

- Model Templates are the building blocks created by the `model()` builder.
- First argument is the **model name** (singular), second is the **collection name** (plural).
- Use `.attrs<T>()` to define the TypeScript interface for your model.
- **JavaScript users** — You can pass a plain object to `.attrs()` instead of a generic (e.g. `.attrs({ name: '', email: '' })`). The object shape gives the IDE good IntelliSense for attributes without TypeScript.
- Templates are **shareable** — use the same template reference for relationships and type inference.
- Models are immutable once created.

</details>

### 2. Collections

Collections are containers for models that live in your schema. They handle CRUD operations and queries.

```typescript
import { collection, relations } from 'miragejs-orm';

const userCollection = collection()
  .model(userModel)
  .factory(userFactory) // Optional
  .relationships({ posts: relations.hasMany(postModel) }) // Optional
  .serializer(userSerializer) // Optional
  .build();
```

**Creating**

```typescript
// New (in-memory only, not saved to DB — uses only the attributes you pass, no factory)
const user = testSchema.users.new({
  name: 'Alice',
  email: 'alice@example.com',
});

// Create with custom attributes
const user = testSchema.users.create({
  name: 'Alice',
  email: 'alice@example.com',
});

// Create with factory traits
const adminUser = testSchema.users.create({ name: 'Admin' }, 'admin');

// Create multiple identical records
const users = testSchema.users.createMany(3);

// Create multiple different records: two regular users and one admin
const users = testSchema.users.createMany([
  [{ name: 'Alice', email: 'alice@example.com' }],
  [{ name: 'Bob', email: 'bob@example.com' }],
  ['admin'], // Using a trait
]);

// Find or create by attributes
const user = testSchema.users.findOrCreateBy(
  { email: 'alice@example.com' },
  { name: 'Alice', role: 'user' },
);

// Find many or create by attributes
const users = testSchema.users.findManyOrCreateBy(
  5,
  { role: 'user' },
  { isActive: true },
);
```

**Querying**

```typescript
// Find by ID
const user = testSchema.users.find('1');

// Find with conditions
const admin = testSchema.users.find({ where: { role: 'admin' } });

// Find many by IDs
const users = testSchema.users.findMany(['1', '2', '3']);

// Find with predicate function
const activeUsers = testSchema.users.findMany({
  where: (user) => user.isActive && user.role === 'admin',
});

// Get all records
const allUsers = testSchema.users.all();

// Get first / last / by index
const first = testSchema.users.first();
const last = testSchema.users.last();
const thirdUser = testSchema.users.at(2);
```

**Record management (update & remove)**

```typescript
// Update a record (model method)
user.update({ name: 'Bob', role: 'admin' });

// Delete a record (model method)
user.destroy();

// Delete by ID (collection method)
testSchema.users.delete('1');

// Delete multiple records (collection method)
testSchema.users.deleteMany(['1', '2', '3']);
```

<details>
<summary><strong>Key points</strong></summary>

- **Creating and finding** — Use collection methods: `create()`, `createMany()`, `find()`, `findMany()`, `findOrCreateBy()`, `findManyOrCreateBy()`, `all()`, `first()`, `last()`, `at()`.
- **Updating and removing** — Use model methods: `model.update()`, `model.destroy()`, or collection helpers `collection.delete(id)` / `collection.deleteMany(ids)`.
- **`new()`** — Creates a model instance in memory only (not saved to the DB), using only the attributes you pass (no factory). Exists mainly for internal use but is exposed for parity with the legacy MirageJS API. Prefer `create()` for building and persisting models in normal application or test code.
- **Database (db) API** — Operating on raw records via `schema.db.collectionName` is not recommended for normal use. The db API is exposed mainly for debugging and low-level access.
- **Naming conventions** — The API uses consistent singular/plural and query patterns:
  - **Singular/plural:** `create()` / `createMany()`, `find()` / `findMany()`, `delete()` / `deleteMany()`.
  - **Query API:** Use `find({ where })` and `findMany({ where })` instead of separate `findBy` / `where`-style APIs.
  - **Find-or-create:** `findOrCreateBy()` and `findManyOrCreateBy()` for conditional creation.

</details>

### 3. Relationships

Define relationships between models using **relations** in your collection configuration. Relations are used only for **schema relationship definitions**. For automatically creating or linking related records in factories, use **associations** (see Factory Associations).

```typescript
import { relations } from 'miragejs-orm';
```

#### HasMany Relationship

Use `relations.hasMany()` to define a one-to-many relationship where a model has multiple related records.

```typescript
// In users collection - define the relationship
relationships: {
  posts: relations.hasMany(postModel),
}

// Usage - access related records
const post = testSchema.posts.create({ title: 'Hello' });
const user = testSchema.users.create({ name: 'Alice', posts: [post] });

console.log(user.posts); // ModelCollection with the post
console.log(user.posts.length); // 1
```

#### BelongsTo Relationship

Use `relations.belongsTo()` to define a many-to-one relationship where a model belongs to another model.

```typescript
// In posts collection - define the relationship
relationships: {
  author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
}

// Usage - access the parent record
const post = testSchema.posts.find('1');
console.log(post.author.name); // Access related user
console.log(post.authorId); // The foreign key value
```

#### Many-to-Many Relationships

For many-to-many relationships, use `relations.hasMany()` on both sides with array foreign keys.

```typescript
import { model, schema, collection, relations } from 'miragejs-orm';

const studentModel = model('student', 'students')
  .attrs<{ name: string; courseIds: string[] }>()
  .build();

const courseModel = model('course', 'courses')
  .attrs<{ title: string; studentIds: string[] }>()
  .build();

const testSchema = schema()
  .collections({
    students: collection()
      .model(studentModel)
      .relationships({
        courses: relations.hasMany(courseModel, {
          foreignKey: 'courseIds',
        }),
      })
      .build(),

    courses: collection()
      .model(courseModel)
      .relationships({
        students: relations.hasMany(studentModel, {
          foreignKey: 'studentIds',
        }),
      })
      .build(),
  })
  .build();

// Usage - bidirectional access
const student = testSchema.students.create({
  name: 'Alice',
  courseIds: ['1', '2'],
});
console.log(student.courses.length); // 2
```

<details>
<summary><strong>Key points</strong></summary>

- **Same model template** — For correct behavior, the model template passed to the collection (`.model(...)`) and to the relationship utilities (`relations.hasMany(...)`, `relations.belongsTo(...)`) must be the same reference. Mismatches can break type inference and relationship resolution.
- **Default foreign key** — The default foreign key is derived from the **target model’s name** (from its template): `belongsTo(userModel)` → `userId`; `hasMany(postModel)` → `postIds`. You don’t need to pass `foreignKey` when your attribute matches this default.
- **Relationship name vs foreign key** — The relationship key (e.g. `author`) is independent of the stored attribute. If you want a different relationship name but the default FK is based on the target model name, specify `foreignKey` explicitly. Example: `author: relations.belongsTo(userModel, { foreignKey: 'authorId' })` uses the key `author` but stores the ID in `authorId`; without `foreignKey`, the default would be `userId` (from `userModel.modelName`).

</details>

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
    role: 'user', // Static default
  })
  .build();
```

#### Derived attributes with resolveFactoryAttr

When one attribute depends on another (e.g. email from name), use the **`resolveFactoryAttr`** helper inside an attr function. It resolves another attr:

- if that attr is a function, it calls it with the current model id;
- if it's a static value, it returns it.

That way you don't have to write the branching yourself: **it replaces** manual checks like `typeof this.name === 'function' ? this.name(id) : this.name` and keeps attr functions readable when they depend on other attrs.

```typescript
import { factory, resolveFactoryAttr } from 'miragejs-orm';
import { faker } from '@faker-js/faker';

const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => faker.person.fullName(),
    email(id) {
      const name = resolveFactoryAttr(this.name, id);
      return `${name.split(' ').join('.').toLowerCase()}@example.com`;
    },
    role: 'user',
  })
  .build();

// Creates e.g. { name: 'John Doe', email: 'john.doe@example.com', role: 'user' }
testSchema.users.create();
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
    role: 'user',
  })
  .traits({
    admin: {
      role: 'admin',
    },
    verified: {
      emailVerified: true,
      afterCreate(model) {
        // Custom logic after creation
        model.update({ verifiedAt: new Date().toISOString() });
      },
    },
    withPosts: {
      posts: associations.createMany(postModel, 3),
    },
  })
  .build();

// Usage
testSchema.users.create(); // Regular user
testSchema.users.create('admin'); // Admin user
testSchema.users.create('admin', 'verified'); // Admin + verified
testSchema.users.create('withPosts'); // User with 3 posts
```

#### Factory Associations

Create related models automatically:

```typescript
import { factory, associations } from 'miragejs-orm';

const userFactory = factory()
  .model(userModel)
  .associations({
    // Create 3 identical posts
    posts: associations.createMany(postModel, 3),
  })
  .traits({
    withProfile: {
      profile: associations.create(profileModel),
    },
  })
  .build();

// Create multiple different related models
const authorFactory = factory()
  .model(userModel)
  .associations({
    posts: associations.createMany(postModel, [
      [{ title: 'First Post', published: true }],
      [{ title: 'Draft Post', published: false }],
      ['featured'], // Using a trait
    ]),
  })
  .build();

// Link to existing models (or create if missing)
const userFactory2 = factory()
  .model(userModel)
  .traits({
    withExistingPost: {
      post: associations.link(postModel), // Finds first existing post, creates one if none exist
    },
    withExistingPosts: {
      posts: associations.linkMany(postModel, 3), // Finds/creates up to 3 posts
    },
  })
  .build();
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
  .build();
```

<details>
<summary><strong>Key points</strong></summary>

- **Build order** — When you call `collection.create(...)` (with optional traits/attrs), the library:
  1. **Factory** evaluates attrs and traits, resolves IDs, returns base attributes (no associations yet);
  2. **Collection** creates the model and **saves it to the DB** so the parent exists;
  3. **Factory** creates or links related models (they can now resolve the parent);
  4. **Collection** reloads the model and applies relationship FK updates (including inverse sync). So the parent is always saved before associations run.
- **Schema type for associations** — Pass your schema collections type to the factory so the `afterCreate` get full type inference and IDE support. Associations should be 'wired' separately:

  ```typescript
  factory<TestCollections>()
    .model(userModel)
    .associations({
      posts: associations.createMany<PostModel, TestCollections>(
        postModel,
        3,
        'published',
      ), // model traits and attributes are suggested by IDE
    })
    .afterCreate((user, schema) => {
      schema.posts.first(); // schema is fully typed
    })
    .build();
  ```

</details>

### 5. Schema

The schema is your in-memory database that ties everything together.

```typescript
import { schema } from 'miragejs-orm';

const testSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
    comments: commentCollection,
  })
  .build();

// Now you can use all collections
testSchema.users.create({ name: 'Alice' });
testSchema.posts.all();
```

#### Fixtures

Load initial data from fixtures. Fixtures are defined at the **collection level** and support a `strategy` option to control when they're loaded:

- `'manual'` (default) - Load fixtures manually by calling `loadFixtures()`
- `'auto'` - Load fixtures automatically during schema setup

```typescript
import { schema, collection } from 'miragejs-orm';

// Manual loading (default)
const testSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .fixtures([
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ])
      .build(),
  })
  .build();

// Load fixtures manually when needed
testSchema.loadFixtures(); // Loads all collection fixtures
testSchema.users.loadFixtures(); // Or load for specific collection

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
        { strategy: 'auto' }, // Fixtures load automatically during setup
      )
      .build(),
  })
  .build(); // Fixtures are already loaded!
```

#### Seeds

Define seed scenarios at the collection level for different testing contexts:

```typescript
import { collection, schema } from 'miragejs-orm';
import { faker } from '@faker-js/faker';

// Define seeds in the collection builder. Use a "default" scenario for loadSeeds({ onlyDefault: true }).
const userCollection = collection()
  .model(userModel)
  .factory(userFactory)
  .seeds({
    default: (schema) => {
      // Loaded when calling testSchema.loadSeeds({ onlyDefault: true })
      schema.users.create({
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'user',
      });
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

    adminUser: (schema) => {
      // Create admin user for permission testing
      schema.users.create({
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      });
    },
  })
  .build();

const postCollection = collection()
  .model(postModel)
  .factory(postFactory)
  .seeds({
    postAuthor: (schema) => {
      // Create posts and assign a user to a random subset
      schema.posts.createMany(20);
      const user = schema.users.create({
        name: 'Alice Author',
        email: 'alice@example.com',
      });

      // Assign user to random 5 posts
      const allPosts = schema.posts.all().models;
      const randomPosts = faker.helpers.arrayElements(allPosts, 5);

      randomPosts.forEach((post) => {
        post.update({ author: user });
      });
    },
  })
  .build();

const testSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
  })
  .build();

// Load all seeds for all collections
await testSchema.loadSeeds();

// Or load seeds for a specific collection
await testSchema.users.loadSeeds();

// Or load a specific scenario for a collection
await testSchema.users.loadSeeds('userForm');
await testSchema.posts.loadSeeds('postAuthor');

// Load only default scenarios (e.g. for development mock server)
await testSchema.loadSeeds({ onlyDefault: true });
```

<details>
<summary><strong>Key points</strong></summary>

- **Create models only through the schema collection API** — Use `testSchema.users.create()`, `testSchema.posts.find()`, etc. Avoid creating or mutating data only via `schema.db`; go through collections so relationships, serializers, and identity managers stay consistent.
- **Default vs named seeds** — Use the **default** seed scenario for the development environment (e.g. `loadSeeds({ onlyDefault: true })` when starting the mock server). Use **named** seed scenarios for specific test cases (e.g. `loadSeeds('userForm')` or `loadSeeds('postAuthor')`). Combining both gives you a stable dev dataset and targeted test data.

</details>

### 6. Serializers

Serializers control how models are converted to JSON. Configure them per collection via the **Serializer** class or by passing a **SerializerConfig** object. Options can be overridden at call time (e.g. `model.toJSON()` or `model.serializer(options)`).

#### Serializer options (SerializerConfig)

- **`select`** — Which attributes to include.

  - **Array:** include only listed keys, e.g. `['id', 'name', 'email']`.
  - **Object:** `{ key: true }` include only those keys; `{ key: false }` exclude those keys (include all others).

- **`with`** — Which relationships to include and how.

  - **Array:** relationship names to include, e.g. `['posts', 'author']`.
  - **Object:** `{ relationName: true }` or `{ relationName: false }` to include/exclude; or `{ relationName: { select: [...], mode: 'embedded' } }` for nested options (e.g. which fields on the relation, or per-relation mode override).

- **`relationsMode`** — How to output relationships (default: `'foreignKey'`).

  - `'foreignKey'` — Only foreign key IDs; no nested relationship data.
  - `'embedded'` — Relationships nested in the model; foreign keys removed.
  - `'embedded+foreignKey'` — Nested and keep foreign keys.
  - `'sideLoaded'` — Relationships at top level (requires `root`). `BelongsTo` as single-item arrays.
  - `'sideLoaded+foreignKey'` — Same and keep foreign keys in attributes.
  - Per-relation overrides are possible inside `with` (e.g. `with: { posts: { mode: 'embedded' } }`).

- **`root`** — Wrap the serialized output in a root key.
  - `true` — Use model/collection name (e.g. `{ user: { ... } }`).
  - `false` — No wrapping (default).
  - **String** — Custom key (e.g. `'userData'` → `{ userData: { ... } }`).

#### Using the Serializer class

```typescript
import { model, collection, schema, Serializer } from 'miragejs-orm';
import type { SerializerConfig } from 'miragejs-orm';

interface UserAttrs {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

interface UserJSON {
  id: string;
  name: string;
  email: string;
}

const userModel = model('user', 'users').attrs<UserAttrs>().build();

const userSerializer = new Serializer(userModel, {
  select: ['id', 'name', 'email'],
  with: { posts: true },
  relationsMode: 'embedded',
  root: true,
});

const testSchema = schema()
  .collections({
    users: collection().model(userModel).serializer(userSerializer).build(),
  })
  .build();

const user = testSchema.users.create({
  name: 'Alice',
  email: 'alice@example.com',
  password: 'secret',
  role: 'admin',
});

const json = user.toJSON();
// With root: true → { user: { id: '1', name: 'Alice', email: 'alice@example.com', posts: [...] } }
```

#### Collection-level serializer config (object)

Pass options directly to the collection instead of a Serializer instance. The collection builds an internal serializer from this config.

```typescript
const testSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .serializer({
        select: ['id', 'name', 'email'],
        root: 'userData',
        with: ['posts'],
        relationsMode: 'embedded',
      })
      .build(),
  })
  .build();

const user = testSchema.users.create({ name: 'Bob', email: 'bob@example.com' });
console.log(user.toJSON());
// { userData: { id: '1', name: 'Bob', email: 'bob@example.com', posts: [...] } }
```

#### Method-level overrides

Override serializer options at call time using the **model’s** `serialize()` method (or `toJSON()` for default options). The model uses the collection’s serializer and passes through your overrides:

```typescript
// Override options when serializing (uses the collection’s serializer)
const json = user.serialize({ root: false });
```

<details>
<summary><strong>Key points (vs original MirageJS)</strong></summary>

- **Built-in serialization; use model methods** — Unlike legacy MirageJS, you don’t need to call serializers directly. Pass the serializer (or config) in the collection config and use **model methods only**: `model.toJSON()`, `model.serialize(options)`, and `collection.toJSON()` for lists. Serialization is built into the model and collection.
- **Config-based API** — Serialization is driven by **select**, **with**, **relationsMode**, and **root** (no separate `attrs` / `embed` / `include`). Relationship inclusion and shape are controlled by `with` and `relationsMode` (e.g. `embedded`, `foreignKey`, `sideLoaded`).
- **One level of nested relationships** — Only one level of nested `with` is supported when serializing related models. Deeper nesting is not part of the serializer API; keep payloads one level for related data.
- **Custom reusable serializers** — Use the **Serializer** class to define a named, reusable serializer (with your own options and optional custom subclass). Attach it to a collection or use it in tests so the same output shape is reused across test files and handlers.

</details>

### 7. Records vs Models

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
const user = testSchema.users.create({
  name: 'Alice',
  email: 'alice@example.com',
});

// The Model instance wraps a Record stored in the database
console.log(user instanceof Model); // true
console.log(user.name); // 'Alice' - attribute accessor
console.log(user.posts); // ModelCollection - relationship accessor

// Under the hood, the record is just:
// { id: '1', name: 'Alice', email: 'alice@example.com', postIds: [] }

// Models are materialized when:
// - Creating: testSchema.users.create(...)
// - Finding: testSchema.users.find('1')
// - Querying: testSchema.users.findMany({ where: ... })
// - Accessing relationships: user.posts (returns ModelCollection of Models)
```

**Why This Matters:**

- 🗄️ **Storage Efficiency** - The database stores lightweight records, not heavy model instances
- 🔄 **Fresh Data** - Each query materializes new model instances with the latest record data
- 🎯 **Type Safety** - Models provide type-safe accessors and methods, records are just data
- 🔗 **Relationships** - Models handle relationship logic, records only store foreign keys

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
const testSchema = schema()
  .collections({
    users: collection().model(userModel).factory(userFactory).build(),
  })
  .build();

// Seed data
testSchema.users.createMany(10);

// Create MSW handlers
const handlers = [
  http.get('/api/users', () => {
    const users = testSchema.users.all();
    return HttpResponse.json({ users: users.toJSON() });
  }),

  http.get('/api/users/:id', ({ params }) => {
    const user = testSchema.users.find(params.id as string);
    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(user.toJSON());
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    const user = testSchema.users.create(body);
    return HttpResponse.json(user.toJSON(), { status: 201 });
  }),
];

const server = setupServer(...handlers);
```

### In Testing (Jest)

With Jest, use a shared schema and reset the database in `beforeEach` so each test starts with a clean state:

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { testSchema } from '@test/schema';

describe('User Management', () => {
  beforeEach(() => {
    testSchema.db.emptyData();
  });

  it('should create a user with posts', () => {
    const user = testSchema.users.create({
      name: 'Alice',
      email: 'alice@example.com',
    });

    testSchema.posts.createMany(3, { authorId: user.id });

    expect(user.posts.length).toBe(3);
    expect(user.posts.models[0].author.id).toBe(user.id);
  });

  it('should handle complex relationships', () => {
    const user1 = testSchema.users.create({ name: 'Alice' });
    const user2 = testSchema.users.create({ name: 'Bob' });

    const post = testSchema.posts.create({
      title: 'Hello',
      authorId: user1.id,
    });

    testSchema.comments.create({
      content: 'Great post!',
      postId: post.id,
      userId: user2.id,
    });

    expect(post.comments.length).toBe(1);
    expect(post.comments.models[0].user.name).toBe('Bob');
  });
});
```

### In Testing (Vitest Context)

With Vitest, you can inject the schema as a **fixture** so each test receives a `schema` argument and the DB is cleared after the test automatically. Extend Vitest’s `test` and use the extended `test` from your context:

```typescript
// test/context.ts
import { test as baseTest } from 'vitest';
import { testSchema } from './schema';

export const test = baseTest.extend<{ schema: typeof testSchema }>({
  schema: async ({}, use) => {
    await use(testSchema);
    testSchema.db.emptyData(); // Teardown: clean after each test
  },
});
```

```typescript
// features/users/api/createUser.test.ts
import { test, describe, expect } from '@test/context';

describe('createUser', () => {
  test('creates user and returns serialized', async ({ schema }) => {
    const result = await createUser({
      name: 'Alice',
      email: 'alice@example.com',
    });
    const user = schema.users.find(result.id)!;

    expect(result).toMatchObject({ name: user.name, email: user.email });
    expect(user).toBeDefined();
  });

  test('can create posts for user', async ({ schema }) => {
    const user = schema.users.create({ name: 'Bob', email: 'bob@example.com' });
    schema.posts.createMany(2, { authorId: user.id });

    expect(user.posts.length).toBe(2);
  });
});
```

Each test gets a fresh logical state: the same `testSchema` instance is used, and `emptyData()` runs after the fixture’s `use()` completes.

### In Storybook

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { UserList } from './UserList';
import { schema, model, collection, factory } from 'miragejs-orm';

// Setup mock data for stories
const setupMockData = (count: number) => {
  const testSchema = schema()
    .collections({
      users: collection()
        .model(userModel)
        .factory(userFactory)
        .build(),
    })
    .build();

  return testSchema.users.createMany(count);
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

Control how IDs are generated via **IdentityManagerConfig** (no need to define a custom class). You can set a default at the **schema level** and override per **collection**.

**Config options:** `initialCounter` (required), optional `initialUsedIds`, optional `idGenerator(currentId) => nextId`.

```typescript
import { schema, collection, IdentityManager } from 'miragejs-orm';
import type { IdentityManagerConfig } from 'miragejs-orm';

// Global default: string IDs starting at "1" (schema-level)
const testSchema = schema()
  .identityManager({ initialCounter: '1' })
  .collections({
    users: userCollection,
    posts: postCollection,
  })
  .build();

// Per-collection override: number IDs for posts only
const postCollection = collection()
  .model(postModel)
  .identityManager({ initialCounter: 1 })
  .build();

// Custom id generator (e.g. UUIDs)
const uuidConfig: IdentityManagerConfig<string> = {
  initialCounter: '0',
  idGenerator: () => crypto.randomUUID(),
};
const usersCollection = collection()
  .model(userModel)
  .identityManager(uuidConfig)
  .build();

// You can also pass an IdentityManager instance per collection
const customManager = new IdentityManager({ initialCounter: 100 });
collection().model(postModel).identityManager(customManager).build();
```

### Custom Serializers

Extend the **Serializer** class when you need a reusable, named serializer with custom logic. Override `serialize()` or `serializeCollection()` and call `super.serialize()` / `super.serializeCollection()` to use the default behavior, then adjust the result. When the custom serializer is passed to the collection, you can use **`.toJSON()`** on the model or collection instead of calling the serializer directly.

```typescript
import { model, collection, schema, Serializer } from 'miragejs-orm';
import type {
  SerializerConfig,
  ModelInstance,
  ModelCollection,
} from 'miragejs-orm';

// Custom serialized types (optional — use .json() so toJSON() is typed)
interface UserJSON {
  id: string;
  name: string;
  email: string;
  role: string;
  displayName: string;
}
interface UserListResponse {
  data: UserJSON[];
}

const userModel = model('user', 'users')
  .attrs<{ id: string; name: string; email: string; role: string }>()
  .json<UserJSON, UserJSON[]>()
  .build();

// Custom serializer: add computed fields; wrap list response in a "data" envelope
class UserApiSerializer extends Serializer<typeof userModel, TestCollections> {
  serialize(
    model: ModelInstance<typeof userModel, TestCollections>,
    options?: Partial<SerializerConfig<typeof userModel, TestCollections>>,
  ) {
    const json = super.serialize(model, options) as Record<string, unknown>;
    json.displayName = `${model.name} (${model.email})`;
    return json;
  }

  serializeCollection(
    collection: ModelCollection<typeof userModel, TestCollections>,
    options?: Partial<SerializerConfig<typeof userModel, TestCollections>>,
  ) {
    const json = super.serializeCollection(collection, options) as Record<
      string,
      unknown
    >;
    const items = json[this.collectionName] as unknown[];
    return { data: items };
  }
}

const userSerializer = new UserApiSerializer(userModel, {
  select: ['id', 'name', 'email', 'role'],
  root: true,
});

const testSchema = schema()
  .collections({
    users: collection().model(userModel).serializer(userSerializer).build(),
  })
  .build();

const user = testSchema.users.create({
  name: 'Alice',
  email: 'alice@example.com',
  role: 'user',
});
const users = testSchema.users.all();

// Option 1: use .toJSON() (uses the collection's serializer)
const singleJson: { user: UserJSON } = user.toJSON();
// { user: { id: '1', name: 'Alice', email: 'alice@example.com', role: 'user', displayName: 'Alice (alice@example.com)' } }

const listJson: UserListResponse = users.toJSON() as UserListResponse;
// { data: [{ id: '1', name: 'Alice', email: 'alice@example.com', role: 'user', displayName: '...' }, ...] }

// Option 2: call the serializer directly (e.g. in handlers or when you hold a serializer reference)
userSerializer.serialize(user);
userSerializer.serializeCollection(users);
```

### Query Methods

MirageJS ORM provides powerful query capabilities including advanced operators, logical combinations, and pagination — features not available in standard MirageJS.

#### Basic Queries

```typescript
// Simple equality
const admins = testSchema.users.findMany({ where: { role: 'admin' } });

// Predicate function
const recentPosts = testSchema.posts.findMany({
  where: (post) => new Date(post.createdAt) > new Date('2024-01-01'),
});
```

#### Advanced Query Operators

```typescript
// Comparison operators
const youngUsers = testSchema.users.findMany({
  where: { age: { lt: 30 } }, // Less than
});

const adults = testSchema.users.findMany({
  where: { age: { gte: 18 } }, // Greater than or equal
});

const rangeUsers = testSchema.users.findMany({
  where: { age: { between: [25, 35] } }, // Between (inclusive)
});

// String operators
const gmailUsers = testSchema.users.findMany({
  where: { email: { like: '%@gmail.com' } }, // SQL-style wildcards
});

const nameSearch = testSchema.users.findMany({
  where: { name: { ilike: '%john%' } }, // Case-insensitive search
});

const usersStartingWithA = testSchema.users.findMany({
  where: { name: { startsWith: 'A' } },
});

// Null checks
const usersWithoutEmail = testSchema.users.findMany({
  where: { email: { isNull: true } },
});

// Array operators
const admins = testSchema.users.findMany({
  where: { tags: { contains: 'admin' } }, // Array includes value
});

const multipleRoles = testSchema.users.findMany({
  where: { tags: { contains: ['admin', 'moderator'] } }, // Array includes all values
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
const activeAdmins = testSchema.users.findMany({
  where: {
    AND: [{ status: 'active' }, { role: 'admin' }],
  },
});

// OR - at least one condition must match
const flaggedUsers = testSchema.users.findMany({
  where: {
    OR: [{ status: 'suspended' }, { age: { lt: 18 } }],
  },
});

// NOT - negate condition
const nonAdmins = testSchema.users.findMany({
  where: {
    NOT: { role: 'admin' },
  },
});

// Complex combinations
const eligibleUsers = testSchema.users.findMany({
  where: {
    AND: [
      {
        OR: [{ status: 'active' }, { status: 'pending' }],
      },
      { NOT: { age: { lt: 18 } } },
      { email: { like: '%@company.com' } },
    ],
  },
});
```

#### Pagination

**Offset-based (Standard)**

```typescript
// Page 1: First 10 users
const page1 = testSchema.users.findMany({
  limit: 10,
  offset: 0,
});

// Page 2: Next 10 users
const page2 = testSchema.users.findMany({
  limit: 10,
  offset: 10,
});

// Combined with filtering and sorting
const activeUsersPage2 = testSchema.users.findMany({
  where: { status: 'active' },
  orderBy: { createdAt: 'desc' },
  offset: 20,
  limit: 10,
});
```

**Cursor-based (Keyset) Pagination**

More efficient for large datasets and prevents inconsistencies when data changes between requests.

```typescript
// First page
const firstPage = testSchema.users.findMany({
  orderBy: { createdAt: 'desc' },
  limit: 10,
});

// Next page using last item as cursor
const lastUser = firstPage[firstPage.length - 1];
const nextPage = testSchema.users.findMany({
  orderBy: { createdAt: 'desc' },
  cursor: { createdAt: lastUser.createdAt },
  limit: 10,
});

// Multi-field cursor for unique sorting
const page = testSchema.users.findMany({
  orderBy: [
    ['score', 'desc'],
    ['createdAt', 'asc'],
  ],
  cursor: { score: 100, createdAt: new Date('2024-01-15') },
  limit: 20,
});
```

#### Combined Operations

```typescript
// Complex query with all features
const results = testSchema.users.findMany({
  where: {
    AND: [
      { status: 'active' },
      {
        OR: [{ role: 'admin' }, { tags: { contains: 'premium' } }],
      },
      { age: { gte: 18 } },
    ],
  },
  orderBy: [
    ['lastActive', 'desc'],
    ['name', 'asc'],
  ],
  offset: 20,
  limit: 10,
});
```

### Direct Database Access

For low-level operations:

```typescript
// Access raw database
const rawUsers = testSchema.db.users.all();

// Batch operations
testSchema.db.emptyData(); // Clear all data
testSchema.db.users.insert({ id: '1', name: 'Alice' });
testSchema.db.users.remove({ id: '1' });
```

### Debugging

Enable logging to understand what the ORM is doing under the hood. This is invaluable for debugging tests, understanding query behavior, and troubleshooting data issues.

**Enable Logging:**

```typescript
import { schema, LogLevel } from 'miragejs-orm';

const testSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
  })
  .logging({
    enabled: true,
    level: LogLevel.DEBUG, // or 'debug'
  })
  .build();
```

**Log Levels:** Use the `LogLevel` enum or string equivalents.

```typescript
import { schema, LogLevel } from 'miragejs-orm';

// Debug - Most verbose, shows all operations
schema().logging({ enabled: true, level: LogLevel.DEBUG });
// Output: Schema initialization, collection registration, create/find operations, query details

// Info - Important operations and results
schema().logging({ enabled: true, level: LogLevel.INFO });
// Output: Fixtures loaded, seeds loaded, high-level operations

// Warn - Potential issues and unusual patterns
schema().logging({ enabled: true, level: LogLevel.WARN });
// Output: Foreign key mismatches, deprecated usage

// Error - Only failures and validation errors
schema().logging({ enabled: true, level: LogLevel.ERROR });
// Output: Operation failures, validation errors

// Silent - No logging (default)
schema().logging({ enabled: true, level: LogLevel.SILENT });
```

**Custom Prefix:**

```typescript
import { schema } from 'miragejs-orm';

const testSchema = schema()
  .collections({ users: userCollection })
  .logging({
    enabled: true,
    level: 'debug',
    prefix: '[MyApp Test]', // Custom prefix instead of default '[Mirage]'
  })
  .build();

// Output: [MyApp Test] DEBUG: Schema initialized
```

**What Gets Logged:**

```typescript
import { schema, collection, LogLevel } from 'miragejs-orm';

const testSchema = schema()
  .logging({ enabled: true, level: LogLevel.DEBUG })
  .collections({
    users: collection()
      .model(userModel)
      .factory(userFactory)
      .fixtures([{ id: '1', name: 'Alice' }])
      .seeds({ testData: (schema) => schema.users.create({ name: 'Bob' }) })
      .build(),
  })
  .build();

// Console output:
// [Mirage] DEBUG: Registering collections { count: 1, names: ['users'] }
// [Mirage] DEBUG: Collection 'users' initialized { modelName: 'user' }
// [Mirage] DEBUG: Schema initialized { collections: ['users'] }

// Load fixtures
testSchema.loadFixtures();
// [Mirage] INFO: Fixtures loaded successfully for 'users' { count: 1 }

// Create a record
testSchema.users.create({ name: 'Charlie' });
// [Mirage] DEBUG: Creating user { collection: 'users' }
// [Mirage] DEBUG: Created user with factory { collection: 'users', id: '2' }

// Query records
const users = testSchema.users.findMany({ where: { name: 'Charlie' } });
// [Mirage] DEBUG: Query 'users': findMany
// [Mirage] DEBUG: Query 'users' returned 1 records

// Load seeds for a specific scenario
testSchema.users.loadSeeds('testData');
// [Mirage] INFO: Seeds loaded successfully for 'users' { scenario: 'testData' }
```

**Use Cases:**

```typescript
import { schema, LogLevel } from 'miragejs-orm';

// Development - See what's happening
const devSchema = schema()
  .collections({ users: userCollection })
  .logging({ enabled: true, level: LogLevel.INFO })
  .build();

// Testing - Debug failing tests
const testSchema = schema()
  .collections({ users: userCollection })
  .logging({
    enabled: process.env.DEBUG === 'true', // Enable via env var
    level: LogLevel.DEBUG,
  })
  .build();
```

---

<div align="center">

## 💡 TypeScript Best Practices

</div>

MirageJS ORM is built with TypeScript-first design. Here are best practices for getting the most out of type safety.

### Defining Shareable Model Template Types

Use `typeof` to create reusable model template types that can be shared across your schema:

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
  .build();

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
  .build();

// Define shareable post model type
export type PostModel = typeof postModel;
```

```typescript
// -- @test/schema/collections/user.collection.ts --
// Use shareable model types in your collections
import {
  userModel,
  type UserModel,
  postModel,
  type PostModel,
} from '@test/schema/models';
```

### Typing Schema

Define explicit schema types for use across your application (e.g. `TestSchema` / `TestCollections` for a test schema):

```typescript
// -- @test/schema/schema.ts or types.ts --
import { schema, collection, relations } from 'miragejs-orm';
import type {
  CollectionConfig,
  HasMany,
  BelongsTo,
  SchemaInstance,
  Factory,
} from 'miragejs-orm';
import type { UserModel, PostModel } from './models';

// Define your schema collections type
export type TestCollections = {
  users: CollectionConfig<
    UserModel,
    { posts: HasMany<PostModel> },
    Factory<UserModel, 'admin' | 'verified', TestCollections>,
    TestCollections
  >;
  posts: CollectionConfig<
    PostModel,
    { author: BelongsTo<UserModel, 'authorId'> },
    Factory<PostModel, 'published', TestCollections>,
    TestCollections
  >;
};

export type TestSchema = SchemaInstance<TestCollections>;
```

### Typing Model Instances

Use the `ModelInstance` type to properly type materialized model instances with full relationship support:

```typescript
import type { ModelInstance } from 'miragejs-orm';
import type { UserModel } from '@test/schema/models';
import type { TestCollections } from '@test/schema/types';

// Type a user model instance
type UserInstance = ModelInstance<UserModel, TestCollections>;

// Usage in functions or variable assignments
function processUser(user: UserInstance) {
  // Full type safety for attributes
  console.log(user.name); // ✅ string
  console.log(user.email); // ✅ string
  console.log(user.role); // ✅ string

  // Full type safety for relationships
  console.log(user.posts); // ✅ ModelCollection<PostModel>
  user.posts.forEach((post) => {
    console.log(post.title); // ✅ Fully typed
  });

  // Full type safety for methods
  user.update({ name: 'New Name' }); // ✅ Type-safe attributes
  user.save(); // ✅ Method available
  user.destroy(); // ✅ Method available
}
```

**How Type Inference Works:**

The `ModelInstance<TTemplate, TSchema>` type uses the schema to construct the complete model type:

1. **Attributes** - Extracted from the model template's `attrs` type
2. **Relationships** - Looked up from the schema's collection configuration
3. **Foreign Keys** - Automatically inferred from relationship definitions
4. **Methods** - Inherited from the base `Model` class (`.save()`, `.update()`, `.destroy()`, `.reload()`, `.link()`, `.unlink()`, `.related()`)
5. **Accessors** - Both attribute accessors and relationship accessors are fully typed

### Typing Collections

Pass schema type to collections for type-safe `schema` usage and data validation (e.g., seeds, fixtures, etc.):

```typescript
// -- @test/schema/collections/user.collection.ts --
import { collection, relations } from 'miragejs-orm';
import { userModel, postModel } from '@test/schema/models';
import type { TestCollections } from '@test/schema/types';

// Create user collection
const userCollection = collection<TestCollections>()
  .model(userModel)
  .relationships({
    posts: relations.hasMany(postModel),
  })
  .seeds({
    testUsers: (schema) => {
      schema.users.create({ name: 'John', email: 'john@example.com' });
      schema.users.create({ name: 'Jane', email: 'jane@example.com' });
    },
  })
  .build();
```

### Typing Factories

Pass schema type to factories for type-safe `associations` and `afterCreate` hooks. Factory type is `Factory<TModel, TTraits, TSchema>` where `TTraits` is the union of trait names:

```typescript
import { factory, associations } from 'miragejs-orm';
import { userModel, postModel } from '@test/schema/models';
import type { TestCollections } from '@test/schema/types';

export const postFactory = factory<TestCollections>() // IDE suggests target model relationships and trait names
  .model(postModel)
  .attrs({
    title: () => 'Sample Post',
    content: () => 'Content here',
  })
  .associations({
    posts: associations.createMany<PostModel, TestCollections>( // IDE suggests related model attributes and trait names
      postModel,
      3,
      'published',
    ),
  })
  .afterCreate((post, schema) => {
    // schema is fully typed! IDE autocomplete works perfectly
    const user = schema.users.first();
    if (user) {
      post.update({ author: user });
    }
  })
  .build();
```

**Key Benefits:**

- ✅ Full IDE autocomplete and IntelliSense
- ✅ Type-safe relationship definitions
- ✅ Catch errors at compile time
- ✅ Refactor with confidence

---

## 📖 API Reference

**Full Documentation Website Coming Soon!** 🚀

We're working on a comprehensive documentation website with detailed API references, interactive examples, and guides. Stay tuned!

In the meantime:

- **TypeScript Definitions**: See the [TypeScript definitions](./lib/dist/index.d.ts) for complete API signatures
- **IDE Autocomplete**: The library is fully typed — your IDE will provide inline documentation and type hints
- **This README**: Contains extensive examples covering most use cases

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

---

## 📄 License

MIT © [MirageJS](LICENSE)

---

**Built with ❤️ for frontend developers who want to move fast without breaking things.**
