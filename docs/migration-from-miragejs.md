# Migrating from MirageJS to Mirage ORM

This guide maps the original [MirageJS](https://miragejs.com) API to **miragejs-orm**. It focuses on the data layer — models, relationships, factories, serialization, and the database — since that is what miragejs-orm reimplements.

> **Scope** — MirageJS bundles an ORM *and* a mock HTTP server (route handlers, timing, passthrough). miragejs-orm is **ORM-only and framework-agnostic**. There is no `routes()`, `server.get()`, `timing`, or `passthrough`. For request mocking, pair the schema with [MSW](https://mswjs.io), a Mirage server, or Axios interceptors. See [Request handling](#request-handling) below.

---

## Mental model shifts

Three changes drive almost every migration:

1. **Monolithic `createServer` → composable builders.** MirageJS configures everything inside one `createServer({ models, factories, serializers, seeds, routes })` call. Mirage ORM splits these into standalone, typed builders (`model()`, `collection()`, `factory()`, `schema()`) that you compose explicitly.
2. **String keys → shared template references.** MirageJS refers to models by string (`schema.create('user')`, `association('user')`). Mirage ORM passes an actual model-template object around, so types flow through your whole schema.
3. **Inflection → explicit names.** MirageJS auto-derives plural collection names and foreign keys from singular model names. Mirage ORM does no inflection: you write every name and key exactly as you want it stored.

---

## Quick reference

| Concept            | MirageJS                                            | miragejs-orm                                                    |
| ------------------ | --------------------------------------------------- | --------------------------------------------------------------- |
| Setup              | `createServer({ ... })`                             | `schema().collections({ ... }).build()`                         |
| Model definition   | `Model.extend({ ... })`                             | `model('user', 'users').attrs<T>().build()`                     |
| Relationship       | `belongsTo()`, `hasMany()` inside `Model.extend`    | `relations.belongsTo()`, `relations.hasMany()` in `.relationships()` |
| Factory            | `Factory.extend({ ... })`                           | `factory().model(m).attrs({ ... }).build()`                     |
| Factory assoc.     | `association('posts')`                              | `associations.create()` / `createMany()` / `link()` / `linkMany()` |
| Create one         | `server.create('user')` / `schema.create('user')`  | `schema.users.create()`                                         |
| Create many        | `server.createList('user', 5)`                      | `schema.users.createMany(5)`                                    |
| Find by id         | `schema.users.find(id)`                             | `schema.users.find(id)`                                         |
| Find by attribute  | `schema.users.findBy({ name })`                     | `schema.users.find({ where: { name } })`                        |
| Filter             | `schema.users.where({ admin: true })`               | `schema.users.findMany({ where: { admin: true } })`             |
| All                | `schema.users.all()`                                | `schema.users.all()`                                            |
| Serializer config  | `Serializer.extend({ ... })` / `JSONAPISerializer`  | `SerializerConfig` object or `Serializer` subclass              |
| Serialize output   | registry-driven                                     | `user.toJSON()`, `users.toJSON()`, `user.serialize<T>()`, `users.serialize<T>()` |
| Identity           | `IdentityManager` class                             | `schema().identityManager(...)`, `collection().identityManager(...)` (config or instance) |
| Raw DB             | `server.db` / `schema.db`                           | `schema.db`                                                     |
| Routing            | `routes()`, `this.get(...)`                         | **Not included** — use MSW or another interceptor               |

---

## Setup

**MirageJS** — everything in one call:

```js
import { createServer, Model, Factory } from 'miragejs';

const server = createServer({
  models: {
    user: Model.extend({ posts: hasMany() }),
    post: Model.extend({ user: belongsTo() }),
  },
  factories: {
    user: Factory.extend({ name: () => 'Alice' }),
  },
  seeds(server) {
    server.create('user');
  },
  routes() {
    this.get('/api/users');
  },
});
```

**Mirage ORM** — composed builders, no routing:

```typescript
import { model, collection, factory, relations, schema } from 'miragejs-orm';

const userModel = model('user', 'users').attrs<{ name: string }>().build();
const postModel = model('post', 'posts').attrs<{ title: string; userId: string }>().build();

const userFactory = factory().model(userModel).attrs({ name: () => 'Alice' }).build();

const testSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .factory(userFactory)
      .relationships({ posts: relations.hasMany(postModel) })
      .seeds((s) => s.users.create())
      .build(),
    posts: collection()
      .model(postModel)
      .relationships({ user: relations.belongsTo(userModel) })
      .build(),
  })
  .build();
```

---

## Models and relationships

In MirageJS, a model defines its relationships inline and has no attribute typing:

```js
const user = Model.extend({
  posts: hasMany(),          // collection 'posts' inferred via inflection
  profile: belongsTo(),      // foreign key 'profileId' inferred
});
```

In Mirage ORM, **attributes** live on the model template and **relationships** live on the collection:

```typescript
const userModel = model('user', 'users')
  .attrs<{ name: string; email: string }>()
  .build();

const users = collection()
  .model(userModel)
  .relationships({
    posts: relations.hasMany(postModel),
    profile: relations.belongsTo(profileModel),
  })
  .build();
```

### Naming and foreign keys

MirageJS inflects: `hasMany('posts')` looks up the `post` model and expects a `postIds` key; `belongsTo('author', { polymorphic })` etc. Mirage ORM derives a **default** key from the target model name but never pluralizes the relationship name itself:

- `relations.belongsTo(userModel)` → foreign key `userId`
- `relations.hasMany(postModel)` → foreign key `postIds`

Override explicitly when your stored key differs:

```typescript
author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
```

MirageJS resolves the collection to side-load during serialization from the inflected model name. Mirage ORM defaults the side-load key to the **target model's collection name**, but you can override it with `collectionName` when your serializer needs a different key:

```typescript
// Relationship is `posts`, but side-load it under `articles` in serialized output
posts: relations.hasMany(postModel, { collectionName: 'articles' }),
```

There is **no automatic inverse detection by name across the whole schema** in the Mirage sense — Mirage ORM auto-detects the inverse when unambiguous, but when a model has multiple relationships to the same target you must set `inverse` explicitly on both sides.

---

## Factories

MirageJS:

```js
Factory.extend({
  name() { return faker.person.fullName(); },
  admin: false,

  afterCreate(user, server) {
    server.createList('post', 3, { user });
  },

  withPosts: trait({
    afterCreate(user, server) {
      server.createList('post', 5, { user });
    },
  }),
});
```

Mirage ORM separates **attrs**, **traits**, **associations**, and **afterCreate** into dedicated builder methods:

```typescript
factory()
  .model(userModel)
  .attrs({
    name: () => faker.person.fullName(),
    admin: false,
  })
  .associations({
    posts: associations.createMany(postModel, 3),
  })
  .traits({
    withPosts: {
      posts: associations.createMany(postModel, 5),
    },
  })
  .afterCreate((user, schema) => {
    // runs after the model and its associations are created
  })
  .build();
```

### Factory associations vs `association()`

MirageJS uses the `association()` helper inside factory attributes. Mirage ORM provides four explicit helpers under `associations`:

| MirageJS                              | miragejs-orm                                  | Behavior                                  |
| ------------------------------------- | --------------------------------------------- | ----------------------------------------- |
| `association('post')`                 | `associations.create(postModel)`              | Always create one new related model        |
| `association('post')` ×N via afterCreate | `associations.createMany(postModel, n)`    | Always create N new related models         |
| *(no direct equivalent)*              | `associations.link(postModel)`                | Find an existing model, else create one    |
| *(no direct equivalent)*              | `associations.linkMany(postModel, n)`         | Find up to N existing, else create to fill |

---

## Creating data

| MirageJS                               | miragejs-orm                              |
| -------------------------------------- | ----------------------------------------- |
| `server.create('user')`               | `schema.users.create()`                   |
| `server.create('user', { name })`     | `schema.users.create({ name })`           |
| `server.create('user', 'admin')`      | `schema.users.create('admin')` (trait)    |
| `server.createList('user', 5)`        | `schema.users.createMany(5)`              |
| `server.createList('user', 5, attrs)` | `schema.users.createMany(5, attrs)`       |

`createMany` also accepts a per-model spec array for heterogeneous batches — something `createList` cannot do:

```typescript
schema.users.createMany([
  [{ name: 'Alice' }],
  [{ name: 'Bob' }],
  ['admin'],            // trait
]);
```

---

## Querying

MirageJS exposes `find`, `findBy`, `where`, `first`, and `all`. Mirage ORM consolidates lookups into **`find`** (single) and **`findMany`** (collection), both accepting an id, a `where` object, or full query options:

| MirageJS                                   | miragejs-orm                                          |
| ------------------------------------------ | ----------------------------------------------------- |
| `schema.users.find('1')`                   | `schema.users.find('1')`                              |
| `schema.users.findBy({ email })`           | `schema.users.find({ where: { email } })`             |
| `schema.users.where({ admin: true })`      | `schema.users.findMany({ where: { admin: true } })`   |
| `schema.users.where(fn)`                   | `schema.users.findMany({ where: fn })`                |
| `schema.users.all()`                       | `schema.users.all()`                                  |
| `schema.users.first()`                     | `schema.users.first()`                                |

Mirage ORM adds query capabilities MirageJS lacks: operators (`gt`, `lt`, `like`, `in`, `between`, …), logical `AND`/`OR`/`NOT`, `orderBy`, `limit`/`offset`, and cursor pagination. See the README's [Query Methods](../README.md#query-methods).

---

## Serializers

MirageJS ships serializer **classes** you extend (`Serializer`, `JSONAPISerializer`, `ActiveModelSerializer`, `RestSerializer`) and registers them by model name. Mirage ORM has **no built-in format presets**; you describe the output with a `SerializerConfig` object on the collection, or subclass `Serializer` for reusable logic.

**MirageJS:**

```js
import { Serializer } from 'miragejs';

const ApplicationSerializer = Serializer.extend({
  attrs: ['id', 'name', 'email'],
  include: ['posts'],
  root: false,
  embed: true,
});
```

**Mirage ORM:**

```typescript
collection()
  .model(userModel)
  .serializer({
    select: ['id', 'name', 'email'],
    with: ['posts'],
    relationsMode: 'embedded',
    root: false,
  })
  .build();
```

Key differences:

- Output is produced via **model methods** — `model.toJSON()`, `model.serialize(opts)`, `collection.toJSON()` — not by calling a serializer registry.
- `attrs` → `select`, `include` → `with`, `embed: true` → `relationsMode: 'embedded'`.
- Only **one level** of nested relationships is supported.
- There is **no JSON:API serializer**. If you need that envelope, build it in a `Serializer` subclass.

---

## Identity managers

**MirageJS** registers an `IdentityManager` class per app or model. **Mirage ORM** accepts a config object (or instance) at the schema or collection level:

```typescript
// Schema-wide default
schema().identityManager({ initialCounter: '1' }).collections({ ... }).build();

// Per-collection, custom generator
collection()
  .model(userModel)
  .identityManager({ initialCounter: '0', idGenerator: () => crypto.randomUUID() })
  .build();
```

---

## Fixtures and seeds

| MirageJS                                  | miragejs-orm                                              |
| ----------------------------------------- | --------------------------------------------------------- |
| `fixtures` option + `server.loadFixtures()` | `.fixtures(records, { strategy })` per collection; `schema.loadFixtures()` |
| `seeds(server) { ... }`                   | `.seeds(fn)` or `.seeds({ named })` per collection; `schema.loadSeeds()`   |

Mirage ORM defines fixtures and seeds **per collection** rather than globally, and seeds support **named scenarios** (`loadSeeds('userForm')`) in addition to a `default`.

---

## Direct database access

Both expose a raw record store. The API is similar:

```typescript
schema.db.users.insert({ name: 'Alice' });
schema.db.users.find('1');
schema.db.emptyData();
```

Prefer the collection API (`schema.users.create()`) for anything involving relationships, factories, or serialization — `schema.db` bypasses all of it.

---

## Request handling

MirageJS intercepts HTTP inside the server config, backed by [Pretender](https://github.com/pretenderjs/pretender) — a third-party library that shims `XMLHttpRequest` to capture requests:

```js
createServer({
  routes() {
    this.get('/api/users', (schema) => schema.users.all());
  },
});
```

Mirage ORM has **no routing and no third-party dependencies** — it ships zero runtime deps and does not bundle Pretender or any interception layer. Instead, wire the schema into the interceptor you already use — e.g. MSW:

```typescript
import { http, HttpResponse } from 'msw';

http.get('/api/users', () => HttpResponse.json(testSchema.users.all().toJSON()));
```

This keeps the ORM decoupled from the transport: the same schema drives MSW (which intercepts via the Service Worker / `fetch` rather than Pretender's XHR shim), a Mirage server, Axios interceptors, or plain unit tests. See the README's [Usage Examples](../README.md#-usage-examples) for MSW, Jest, Vitest, and Storybook setups.

---

## No direct equivalent

These MirageJS features are intentionally out of scope:

- **Routing / server** — `routes()`, `this.get/post/...`, `timing`, `passthrough`, `namespace`.
- **Format serializer presets** — `JSONAPISerializer`, `ActiveModelSerializer`, `RestSerializer`.
- **`normalizedRequestAttrs()`** — a route-handler helper; not applicable without routing.
- **Inflection** — derive plural/foreign-key names yourself.
