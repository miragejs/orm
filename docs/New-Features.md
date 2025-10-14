# New Features Guide

This document provides an overview of the major new features in the ORM, including the Builder API, relationships, factories with associations, and built-in serialization.

## Table of Contents

- [Builder API](#builder-api)
  - [Model Builder](#model-builder)
  - [Factory Builder](#factory-builder)
  - [Collection Builder](#collection-builder)
  - [Schema Builder](#schema-builder)
- [Relationships](#relationships)
- [Factory Associations](#factory-associations)
  - [Type-Safe Factories with Shared Schema Type](#type-safe-factories-with-shared-schema-type)
- [Serialization](#serialization)
- [Advanced: Extending and Customization](#advanced-extending-and-customization)
  - [Extending Factories](#extending-factories)
  - [Extending Serializers](#extending-serializers)
  - [Extending Identity Managers](#extending-identity-managers)

---

## Builder API

The ORM now provides a fluent, type-safe Builder API for defining models, factories, collections, and schemas. All builders follow a consistent pattern: configure with chainable methods, then call `.create()` (or `.setup()` for schemas) to finalize.

### Model Builder

Define your models using the `model()` builder:

```typescript
import { model } from '@miragejs/orm';

// Define attributes type
interface UserAttrs {
  name: string;
  email: string;
  role?: string;
}

interface PostAttrs {
  title: string;
  content: string;
  authorId: string;
}

// Create model templates
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .json<UserJSON, UsersJSON[]>() // Optional: Define serialization types for `.toJSON` methods
  .create();

const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<PostAttrs>()
  .create();
```

**Available methods:**
- `.name(name)` - Set the model name (required)
- `.collection(name)` - Set the collection name (required)
- `.attrs<TAttrs>()` - Define model attributes type (required)
- `.json<TSerializedModel, TSerializedCollection>()` - Define serialization output types (optional)
- `.create()` - Finalize and create a model template for your future model instances

### Factory Builder

Define test data factories using the `factory()` builder:

```typescript
import { factory, associations } from '@miragejs/orm';

const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => faker.person.fullName(),
    email: () => faker.internet.email(),
    role: 'user', // Static value
  })
  .associations({
    posts: associations.createMany(postModel, 3),
  })
  .traits({
    admin: { role: 'admin' },
  })
  .afterCreate((user, schema) => {
    // Optional: Hook to run after model creation
    console.log(`Created user: ${user.name}`);
  })
  .create();
```

**Available methods:**
- `.model(template)` - Associate with model template (required)
- `.attrs(attributes)` - Define default attributes (optional)
- `.associations(relationships)` - Create related models (optional)
- `.traits(traits)` - Define trait variations (optional)
- `.afterCreate(hook)` - Add post-creation hook (optional)
- `.create()` - Finalize and create the factory

### Collection Builder

Define collection configurations using the `collection()` builder:

```typescript
import { collection, associations, Serializer } from '@miragejs/orm';

const userCollection = collection()
  .model(userModel)
  .relationships({
    posts: associations.hasMany(postModel), // foreignKey defaults to 'postIds' based on model name
  })
  .factory(userFactory)
  .serializer({
    attrs: ['id', 'name', 'email'],  // Only include specific attributes
    root: true,                      // Wrap in { user: {...} }
    include: ['posts'],              // Include relationships
    embed: false,                    // Side-load (default) vs embed
  })
  .create();

const postCollection = collection()
  .model(postModel)
  .relationships({
    author: associations.belongsTo(userModel, { foreignKey: 'authorId' }), // Define foreignKey for a custom association name
  })
  .serializer(new CustomSerializer(postModel)) // Use custom serializer
  .create();
```

**Available methods:**
- `.model(template)` - Associate with model template (required)
- `.relationships(rels)` - Define model relationships (optional)
- `.factory(factory)` - Associate with factory (optional)
- `.serializer(config | serializer)` - Configure serialization (optional)
- `.identityManager(manager)` - Custom ID generation (optional)
- `.create()` - Finalize and create the collection config

### Schema Builder

Set up your schema with all collections using the `schema()` builder:

```typescript
import { schema, StringIdentityManager } from '@miragejs/orm';

const appSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
  })
  .identityManager(new NumberIdentityManager()) // Optional: defaults to StringIdentityManager
  .serializer({ root: true, embed: true })      // Optional: global serializer options
  .setup();

// Use the schema (it provides type-safe collection accessors)
const admin = appSchema.users.create({ email: 'admin@gmail.com' }, 'admin');
const user = appSchema.users.create();
const post = appSchema.posts.create({ title: 'Hello', content: 'World', authorId: user.id });

user.reload();

console.log(post.author.name);  // 'John'
console.log(user.posts.length); // 1
```

**Available methods:**
- `.collections(collections)` - Define all collections (required)
- `.identityManager(manager)` - Set global ID generator (optional)
- `.serializer(config|serializer)` - Set global serializer options (optional)
- `.setup()` - Finalize and set up the schema with database

---

## Relationships

The ORM supports `belongsTo` and `hasMany` relationships with automatic foreign key management and type-safe relationship accessors.

### Defining Relationships

Relationships are defined at the collection level using the `.relationships()` method:

```typescript
import { collection, associations } from '@miragejs/orm';

// User hasMany Posts
const userCollection = collection()
  .model(userModel)
  .relationships({
    // Default foreign key: 'postIds' (derived from model name (e.g. model().name(modelName))
    posts: associations.hasMany(postModel),
    
    // Custom relationship with custom foreign key for consistency
    articles: associations.hasMany(postModel, { foreignKey: 'articleIds' }),
  })
  .create();

// Post belongsTo User
const postCollection = collection()
  .model(postModel)
  .relationships({
    // Default foreign key: 'userId' (derived from model name)
    user: associations.belongsTo(userModel),
  })
  .create();
```

### Foreign Key Options

By default, foreign keys are automatically derived from relationship names:
- **`belongsTo`**: `modelName + 'Id'` (e.g., `author` → `authorId`)
- **`hasMany`**: `modelName + 'Ids'` (e.g., `posts` → `postIds`)

You can customize foreign keys using the `foreignKey` option:

```typescript
relationships({
  // Custom name for belongsTo
  creator: associations.belongsTo(userModel, { foreignKey: 'createdBy' }),
  
  // Custom name for hasMany
  articles: associations.hasMany(postModel, { foreignKey: 'ownArticleIds' }),
})
```

### Working with Relationships

The ORM provides multiple ways to work with relationships: creating models with relationships, updating relationships via setters, and using helper methods.

#### Creating Models with Relationships

You can create models with relationships in several ways:

```typescript
const appSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
  })
  .setup();

// 1. Create with foreign key
const user = appSchema.users.create({ name: 'Alice', email: 'alice@example.com' });
const post1 = appSchema.posts.create({
  title: 'Post 1',
  content: 'Content 1',
  authorId: user.id, // Set foreign key directly
});

console.log(post1.author.name); // 'Alice'

// 2. Create with related model
const post2 = appSchema.posts.create({
  title: 'Post 2',
  content: 'Content 2',
  author: user, // Pass the model instance
});

console.log(post2.authorId); // Same as user.id

// 3. Create with array of IDs (hasMany)
const user2 = appSchema.users.create({
  name: 'Bob',
  email: 'bob@example.com',
  postIds: [post1.id, post2.id], // Set foreign keys array
});

console.log(user2.posts.length); // 2

// 4. Create with array of models (hasMany)
const post3 = appSchema.posts.create({ title: 'Post 3', content: 'Content 3' });
const user3 = appSchema.users.create({
  name: 'Charlie',
  email: 'charlie@example.com',
  posts: [post3], // Pass array of models
});

console.log(user3.postIds); // [post3.id]
```

#### Updating Relationships with Setters

Relationships can be updated by setting the foreign key or the related model directly:

```typescript
// Update belongsTo via foreign key
post1.authorId = user2.id;
console.log(post1.author.name); // 'Bob'

// Update belongsTo via related model
post1.author = user3;
console.log(post1.authorId); // user3.id
console.log(post1.author.name); // 'Charlie'

// Update hasMany via foreign keys array
user.postIds = [post1.id, post2.id, post3.id];
console.log(user.posts.length); // 3

// Update hasMany via models array
user.posts = [post1, post2];
console.log(user.postIds); // [post1.id, post2.id]
console.log(user.posts.length); // 2

// Clear relationships
post1.author = null; // Clear belongsTo
console.log(post1.authorId); // null

user.posts = []; // Clear hasMany
console.log(user.postIds); // []
```

#### Updating Relationships with .update()

Use the `update()` method for batch updates including relationships:

```typescript
// Update with foreign key
post1.update({
  title: 'Updated Post 1',
  authorId: user.id,
});

// Update with related model
post2.update({
  content: 'Updated content',
  author: user2,
});

console.log(post2.authorId); // user2.id

// Update hasMany relationships
user.update({
  name: 'Alice Updated',
  postIds: [post1.id, post2.id, post3.id],
});

console.log(user.posts.length); // 3

// Update with array of models
user.update({
  posts: [post1, post2],
});

console.log(user.postIds); // [post1.id, post2.id]
```

#### Linking and Unlinking Relationships

Use `link()` and `unlink()` methods for adding/removing relationships without replacing all:

```typescript
// Link single model
user.link('posts', post3);
console.log(user.posts.length); // 3 (added to existing)

// Link multiple models
const post4 = appSchema.posts.create({ title: 'Post 4', content: 'Content 4' });
const post5 = appSchema.posts.create({ title: 'Post 5', content: 'Content 5' });
user.link('posts', [post4, post5]);
console.log(user.posts.length); // 5

// Unlink single model
user.unlink('posts', post3);
console.log(user.posts.length); // 4

// Unlink multiple models
user.unlink('posts', [post4, post5]);
console.log(user.posts.length); // 2

// Access relationships via property
console.log(user.posts.at(0).title); // 'Post 1'
console.log(user.posts.models); // Array of model instances

// Or use .related() method
const posts = user.related('posts'); // Returns ModelCollection
console.log(posts?.length); // 2

const author = post1.related('author'); // Returns single model or null
console.log(author?.name); // 'Alice'
```

#### Reloading Relationships

If relationships change externally, use `reload()` to refresh:

```typescript
const user = appSchema.users.first();
const post = appSchema.posts.first();

// Link post to user externally
post.authorId = user.id;

// Reload user to see the new relationship
user.reload();
console.log(user.posts.length); // Includes the newly linked post
```

### Available Relationship Helpers

**Association Definitions:**
- **`associations.belongsTo(model, options?)`** - Define a belongsTo relationship
- **`associations.hasMany(model, options?)`** - Define a hasMany relationship

**Instance Methods:**
- **`model.related(relationshipName)`** - Get related model(s) for a relationship
- **`model.link(relationshipName, model|models)`** - Link models to a relationship
- **`model.unlink(relationshipName, model|models)`** - Unlink models from a relationship

---

## Factory Associations

Factories can automatically create and link related models using association helpers. This is especially useful for generating complex test data.

### Basic Factory without Associations

Without association helpers, you need to manually create and link related models using the `afterCreate` hook:

```typescript
import { factory } from '@miragejs/orm';

// Manual approach: creating relationships in afterCreate
const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => faker.person.fullName(),
    email: () => faker.internet.email(),
  })
  .afterCreate((user, schema) => {
    // Manually create related posts
    const post1 = schema.posts.create({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      authorId: user.id,
    });
    const post2 = schema.posts.create({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      authorId: user.id,
    });
    const post3 = schema.posts.create({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      authorId: user.id,
    });
    
    // Manually link posts to user
    user.link('posts', [post1, post2, post3]);
  })
  .create();

const postFactory = factory()
  .model(postModel)
  .attrs({
    title: () => faker.lorem.sentence(),
    content: () => faker.lorem.paragraph(),
  })
  .afterCreate((post, schema) => {
    // Manually find and link an existing author
    const users = schema.users.all();
    
    if (users.length > 0) {
      // Get random existing user
      const randomIndex = Math.floor(Math.random() * users.length);
      const author = users.at(randomIndex);
      
      // Link post to author
      post.update({ authorId: author.id });
    }
  })
  .create();

// Usage
const user = appSchema.users.create(); // Creates user with 3 posts
const post = appSchema.posts.create(); // Creates post linked to random existing user (if any)
```

**Drawbacks of Manual Approach:**
- Verbose and repetitive code
- Error-prone (easy to forget linking steps, null checks, random selection logic)
- Hard to maintain (changes require updating multiple places)
- No traits support for relationship variations
- Requires direct schema access in hooks
- Manual random selection implementation needed

### Using Association Helpers

Association helpers simplify relationship creation with a declarative, type-safe API:

```typescript
import { factory, associations } from '@miragejs/orm';

// Improved approach: using association helpers
const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => faker.person.fullName(),
    email: () => faker.internet.email(),
  })
  .associations({
    posts: associations.createMany(postModel, 3), // Automatically create 3 posts and link them
  })
  .create();

const postFactory = factory()
  .model(postModel)
  .attrs({
    title: () => faker.lorem.sentence(),
    content: () => faker.lorem.paragraph(),
  })
  .associations({
    author: associations.link(userModel), // Automatically find and link to random existing user
  })
  .create();

// Usage - same as before, but much cleaner factory definitions
const user = appSchema.users.create(); // Creates user with 3 posts
const post = appSchema.posts.create(); // Creates post linked to random existing user
```

**Benefits of Association Helpers:**
- ✅ Concise and declarative syntax
- ✅ Automatic creation and linking (or finding for `link()`)
- ✅ Automatic random selection for linking
- ✅ Type-safe with full IntelliSense support
- ✅ Works seamlessly with traits
- ✅ Reusable across different factory instances
- ✅ No need for manual schema access or null checks

**With Traits for Variations:**

```typescript
const postFactory = factory()
  .model(postModel)
  .attrs({
    title: () => faker.lorem.sentence(),
    content: () => faker.lorem.paragraph(),
  })
  .traits({
    withAuthor: {
      author: associations.create(userModel), // Create relationship only when trait is used
    },
    withAdmin: {
      author: associations.create(userModel, 'admin'), // Create with specific trait
    },
  })
  .create();

// Usage
const post1 = appSchema.posts.create(); // No author
const post2 = appSchema.posts.create('withAuthor'); // With regular user
const post3 = appSchema.posts.create('withAdmin'); // With admin user
```

### Type-Safe Factories with Shared Schema Type

For better type safety and IntelliSense when using associations, define a shared schema type that your factories can reference. This provides full autocomplete and type checking for association helpers:

```typescript
import { 
  factory, 
  associations, 
  collection, 
  schema,
  type Factory,
  type SchemaCollectionConfig,
  type TraitDefinition,
  type BelongsTo,
  type HasMany,
} from '@miragejs/orm';

// Define attribute types
type UserAttrs = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

type PostAttrs = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  published?: boolean;
};

type CommentAttrs = {
  id: string;
  content: string;
  postId: string;
  userId: string;
};

// Create models
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .create();

const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<PostAttrs>()
  .create();

const commentModel = model()
  .name('comment')
  .collection('comments')
  .attrs<CommentAttrs>()
  .create();

// Define model types
type UserModel = typeof userModel;
type PostModel = typeof postModel;
type CommentModel = typeof commentModel;

// Define shared schema type
type AppSchema = {
  users: SchemaCollectionConfig<
    UserModel,
    {
      posts: HasMany<PostModel>;
      comments: HasMany<CommentModel>;
    },
    Factory<
      UserModel,
      AppSchema,
      {
        admin: TraitDefinition<AppSchema, UserModel>;
      }
    >
  >;
  posts: SchemaCollectionConfig<
    PostModel,
    {
      author: BelongsTo<UserModel, 'authorId'>;
      comments: HasMany<CommentModel>;
    },
    Factory<
      PostModel,
      AppSchema,
      {
        published: TraitDefinition<AppSchema, PostModel>;
      }
    >
  >;
  comments: SchemaCollectionConfig<
    CommentModel,
    {
      post: BelongsTo<PostModel, 'postId'>;
      user: BelongsTo<UserModel, 'userId'>;
    }
  >;
};

// Create factories with schema type for full IntelliSense
const userFactory = factory<AppSchema>()
  .model(userModel)
  .attrs({
    name: () => faker.person.fullName(),
    email: () => faker.internet.email(),
  })
  .traits({
    admin: { role: 'admin' },
  })
  .create();

const postFactory = factory<AppSchema>()
  .model(postModel)
  .attrs({
    title: () => faker.lorem.sentence(),
    content: () => faker.lorem.paragraph(),
  })
  .associations({
    // Full type safety: IDE will autocomplete available traits and model attributes
    author: associations.create<AppSchema, UserModel>(userModel, 'admin'),
  })
  .traits({
    published: { published: true },
  })
  .create();

const commentFactory = factory<AppSchema>()
  .model(commentModel)
  .attrs({
    content: () => faker.lorem.sentence(),
  })
  .associations({
    // Type-safe associations with full IntelliSense
    post: associations.create<AppSchema, PostModel>(postModel),
    user: associations.create<AppSchema, UserModel>(userModel),
  })
  .create();

// Setup schema
const appSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .factory(userFactory)
      .relationships({
        posts: associations.hasMany(postModel),
        comments: associations.hasMany(commentModel),
      })
      .create(),
    posts: collection()
      .model(postModel)
      .factory(postFactory)
      .relationships({
        author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
        comments: associations.hasMany(commentModel),
      })
      .create(),
    comments: collection()
      .model(commentModel)
      .factory(commentFactory)
      .relationships({
        post: associations.belongsTo(postModel),
        user: associations.belongsTo(userModel),
      })
      .create(),
  })
  .setup();

// Now get full type safety when creating models
const post = appSchema.posts.create(); // Creates post with admin user automatically
const comment = appSchema.comments.create(); // Creates comment with post and user
```

**Benefits of Shared Schema Type:**
- Full IntelliSense for association helpers (autocomplete models and traits)
- Type checking ensures associations reference valid models
- Compile-time errors if relationships are misconfigured
- Better refactoring support (renames propagate correctly)
- Documentation through types (IDE shows available traits and relationships)

### Traits with Associations

Traits can also include associations, allowing you to create variations with different relationships:

```typescript
const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => faker.person.fullName(),
    email: () => faker.internet.email(),
  })
  .traits({
    // Trait without associations
    admin: {
      role: 'admin',
    },
    
    // Trait with associations
    withPosts: {
      posts: associations.createMany(postModel, 5),
    },
    
    // Trait with linked associations (use existing models)
    withLinkedPosts: {
      posts: associations.linkMany(postModel, 3), // Link 3 existing posts
    },
    
    // Combine both
    adminWithPosts: {
      role: 'admin',
      posts: associations.createMany(postModel, 2),
    },
  })
  .create();

// Usage
const appSchema = schema()
  .collections({
    users: collection().model(userModel).factory(userFactory).create(),
    posts: collection().model(postModel).factory(postFactory).create(),
  })
  .setup();

// Create user with trait
const user = appSchema.users.create('withPosts');
console.log(user.posts.length); // 5

// Create user with multiple traits
const admin = appSchema.users.create('admin', 'withPosts');
console.log(admin.role);         // 'admin'
console.log(admin.posts.length); // 5
```

### Available Association Helpers

All helpers are available via the `associations` object:

- **`associations.create(model, ...traitsOrDefaults)`** - Create a single related model
- **`associations.createMany(model, count, ...traitsOrDefaults)`** - Create multiple related models
- **`associations.link(model, ...traitsOrDefaults)`** - Link to an existing model (random) or create a new one (random)
- **`associations.linkMany(model, count, ...traitsOrDefaults)`** - Link to existing models (random selection) or create new ones

---

## Serialization

The ORM includes built-in serialization that's deeply integrated with models and collections. Unlike MirageJS, key formatting is completely user-controlled, and serialization is accessible via simple `.toJSON()` calls.

### Key Features

- ✅ **Built-in**: Available on all models and collections via `.toJSON()`
- ✅ **User-controlled types**: Define your own JSON output types
- ✅ **Relationship support**: Side-loading and embedding
- ✅ **Two-level configuration**: Global (schema) and collection-specific
- ✅ **No key formatting**: You control the exact output structure

### Basic Serialization

```typescript
import { model, schema, collection } from '@miragejs/orm';

// Define your JSON types
interface UserJSON {
  id: string;
  name: string;
  email: string;
}

// Create model with JSON types
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<{ id: string; name: string; email: string; password: string }>()
  .json<UserJSON, UserJSON[]>()
  .create();

const appSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .serializer({
        attrs: ['id', 'name', 'email'], // Exclude 'password'
      })
      .create(),
  })
  .setup();

const user = appSchema.users.create({
  name: 'John',
  email: 'john@example.com',
  password: 'secret123',
});

// Serialize single model
const json = user.toJSON();
// Result: { id: '1', name: 'John', email: 'john@example.com' }

// Serialize collection
const allUsers = appSchema.users.all();
const collectionJson = allUsers.toJSON();
// Result: [{ id: '1', name: 'John', email: 'john@example.com' }, ...]
```

### Serialization Options

Configure serialization at the collection or schema level:

```typescript
interface SerializerOptions {
  // Data selection (collection-level only)
  attrs?: string[];      // Specific attributes to include
  include?: string[];    // Relationship names to include
  
  // Structural options (schema or collection level)
  root?: boolean | string;  // Wrap in root key
  embed?: boolean;          // Embed relationships (true) or side-load (false)
}
```

### Root Wrapping

```typescript
const userCollection = collection()
  .model(userModel)
  .serializer({
    root: true, // Use model/collection name as root key
  })
  .create();

const user = appSchema.users.first();

// Single model
user.toJSON();
// Result: { user: { id: '1', name: 'John', email: 'john@example.com' } }

// Collection
appSchema.users.all().toJSON();
// Result: { users: [{ id: '1', ... }, { id: '2', ... }] }

// Custom root key
.serializer({ root: 'currentUser' })
// Result: { currentUser: { id: '1', ... } }
```

### Relationships in Serialization

#### Side-loading (embed: false)

Keep foreign keys and add full related models alongside:

```typescript
const postCollection = collection()
  .model(postModel)
  .relationships({
    author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
  })
  .serializer({
    include: ['author'],
    embed: false, // Default: side-load
  })
  .create();

const post = appSchema.posts.first();
post.toJSON();
// Result:
// {
//   id: '1',
//   title: 'My Post',
//   content: 'Content here',
//   authorId: '123',              // Foreign key preserved
//   author: {                      // Full model added
//     id: '123',
//     name: 'John',
//     email: 'john@example.com'
//   }
// }
```

#### Embedding (embed: true)

Replace foreign keys with embedded models:

```typescript
.serializer({
  include: ['author'],
  embed: true, // Embed relationships
})

post.toJSON();
// Result:
// {
//   id: '1',
//   title: 'My Post',
//   content: 'Content here',
//   author: {                      // Foreign key removed, model embedded
//     id: '123',
//     name: 'John',
//     email: 'john@example.com'
//   }
// }
```

#### Side-loading with Root

When using `root: true` with side-loading, related models appear at the root level:

```typescript
.serializer({
  root: true,
  include: ['author'],
  embed: false,
})

post.toJSON();
// Result:
// {
//   post: {
//     id: '1',
//     title: 'My Post',
//     content: 'Content here',
//     authorId: '123'
//   },
//   author: {                      // Side-loaded at root level
//     id: '123',
//     name: 'John',
//     email: 'john@example.com'
//   }
// }
```

### Global Serializer Configuration

Set default serialization options at the schema level:

```typescript
const appSchema = schema()
  .serializer({
    root: true,   // All collections use root wrapping by default
    embed: true,  // All relationships embedded by default
  })
  .collections({
    users: collection()
      .model(userModel)
      .serializer({ include: ['posts'] }) // Inherits global root and embed
      .create(),
    
    posts: collection()
      .model(postModel)
      .serializer({
        include: ['author'],
        embed: false, // Override global: side-load instead
      })
      .create(),
  })
  .setup();
```

**Priority**: Collection-level options override global options.

### Custom Serializers

For advanced use cases, extend the base `Serializer` class:

```typescript
import { Serializer } from '@miragejs/orm';

class CustomUserSerializer extends Serializer {
  protected _getAttributes(model) {
    const attrs = super._getAttributes(model);
    return {
      ...attrs,
      displayName: `${attrs.name} (${attrs.email})`,
      // Add computed fields, transform data, etc.
    };
  }
}

const userCollection = collection()
  .model(userModel)
  .serializer(new CustomUserSerializer(userModel, { root: true }))
  .create();
```

### Complete Example

```typescript
import { model, schema, collection, factory, associations } from '@miragejs/orm';

// Define models
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<{ name: string; email: string }>()
  .json<UserJSON, UserJSON[]>()
  .create();

const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<{ title: string; content: string; authorId: string }>()
  .json<PostJSON, PostsJSON>()
  .create();

// Setup schema with serialization
const appSchema = schema()
  .serializer({ root: true }) // Global: use root wrapping
  .collections({
    users: collection()
      .model(userModel)
      .relationships({
        posts: associations.hasMany(postModel),
      })
      .serializer({
        attrs: ['id', 'name', 'email'],
        include: ['posts'],
        embed: true, // Embed posts
      })
      .create(),
    
    posts: collection()
      .model(postModel)
      .relationships({
        author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
      })
      .serializer({
        include: ['author'],
        embed: false, // Side-load author
      })
      .create(),
  })
  .setup();

// Create data
const user = appSchema.users.create({ name: 'Alice', email: 'alice@example.com' });
const post = appSchema.posts.create({ title: 'Hello', content: 'World', authorId: user.id });
user.link('posts', [post]);

// Serialize
const userJson = user.toJSON();
// Result:
// {
//   user: {
//     id: '1',
//     name: 'Alice',
//     email: 'alice@example.com',
//     posts: [{
//       id: '2',
//       title: 'Hello',
//       content: 'World',
//       authorId: '1'
//     }]
//   }
// }

const postJson = post.toJSON();
// Result:
// {
//   post: {
//     id: '2',
//     title: 'Hello',
//     content: 'World',
//     authorId: '1'
//   },
//   author: {
//     id: '1',
//     name: 'Alice',
//     email: 'alice@example.com'
//   }
// }
```

---

## Advanced: Extending and Customization

The ORM provides powerful extension mechanisms for factories, serializers, and identity managers, allowing you to customize behavior to fit your specific needs.

### Extending Factories

You can extend existing factories to create variations without duplicating configuration. Use the `factory().extend()` method:

```typescript
import { factory, associations } from '@miragejs/orm';

// Base user factory (without permissions)
const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => faker.person.fullName(),
    email: () => faker.internet.email(),
    role: 'user',
  })
  .create();

// Extend the base factory for admin users (with permissions)
const adminFactory = factory()
  .model(adminModel)
  .extend(userFactory)
  .attrs({
    role: 'admin',  // Override the role
    permissions: ['read', 'write', 'delete'],  // Add new attributes
  })
  .afterCreate((admin, schema) => {
    // Custom post-creation logic for admins
    console.log(`Admin created: ${admin.name}`);
  })
  .create();

// Extend further (privileges may be granted)
const currentUserFactory = factory()
  .model(currentUserModel)
  .extend(adminFactory)
  .attrs({
    role: 'activeUser',
    permissions: ['read', 'delete'],  // Override permissions
  })
  .create();
```

**Key Benefits:**
- Inherits all attributes, traits, and associations from the base factory
- Override specific attributes without redefining everything
- Add new attributes, traits, and hooks
- Create hierarchies of factories for different variations

### Extending Serializers

For custom serialization logic, extend the `Serializer` class using standard TypeScript class inheritance:

```typescript
import { Serializer } from '@miragejs/orm';
import type { ModelInstance, SchemaCollections } from '@miragejs/orm';

// Custom serializer with additional formatting
class CustomUserSerializer extends Serializer<UserModel> {
  // Override the serializeData method to add custom logic
  serializeData<TSchema extends SchemaCollections>(
    model: ModelInstance<UserModel, TSchema>,
  ): Record<string, any> {
    const data = super.serializeData(model);
    
    // Add custom transformations
    return {
      ...data,
      fullName: data.name?.toUpperCase(), // Transform name
      createdAt: new Date().toISOString(), // Add timestamp
    };
  }
}

// Use the custom serializer
const userCollection = collection()
  .model(userModel)
  .serializer(new CustomUserSerializer(userModel, {
    attrs: ['id', 'name', 'email'],
    root: true,
  }))
  .create();
```

**Available Methods to Override:**
- `serializeData(model)` - Serialize model data without root wrapping (for embedding)
- `serialize(model)` - Serialize model with root wrapping
- `serializeCollectionData(collection)` - Serialize collection data without root wrapping
- `serializeCollection(collection)` - Serialize collection with root wrapping

**Protected Properties Available:**
- `_template` - The model template
- `_modelName` - The model name
- `_collectionName` - The collection name
- `_attrs` - Attributes filter configuration
- `_root` - Root wrapping configuration
- `_embed` - Embedding configuration
- `_include` - Relationships to include

### Extending Identity Managers

The ORM includes two built-in identity managers for common use cases:

#### Built-in Identity Managers

1. **`StringIdentityManager`** - Generates string IDs (default)
   ```typescript
   import { StringIdentityManager } from '@miragejs/orm';
   
   const idManager = new StringIdentityManager();
   idManager.fetch(); // => "1"
   idManager.fetch(); // => "2"
   idManager.fetch(); // => "3"
   ```

2. **`NumberIdentityManager`** - Generates numeric IDs
   ```typescript
   import { NumberIdentityManager } from '@miragejs/orm';
   
   const idManager = new NumberIdentityManager();
   idManager.fetch(); // => 1
   idManager.fetch(); // => 2
   idManager.fetch(); // => 3
   ```

#### Using Identity Managers in Schema

```typescript
import { schema, StringIdentityManager, NumberIdentityManager } from '@miragejs/orm';

// Use string IDs globally (default)
const appSchema = schema()
  .identityManager(new StringIdentityManager())
  .collections({ ... })
  .setup();

// Or use number IDs globally
const appSchema = schema()
  .identityManager(new NumberIdentityManager())
  .collections({ ... })
  .setup();

// Or set per collection
const userCollection = collection()
  .model(userModel)
  .identityManager(new NumberIdentityManager())
  .create();
```

#### Custom Identity Managers

Extend the base `IdentityManager` class for custom ID generation logic:

```typescript
import { IdentityManager } from '@miragejs/orm';

// UUID-based identity manager
class UUIDIdentityManager extends IdentityManager<string> {
  constructor() {
    super({
      initialCounter: crypto.randomUUID(),
      idGenerator: () => crypto.randomUUID(),
    });
  }
}

// Custom prefixed ID manager
class PrefixedIdentityManager extends IdentityManager<string> {
  constructor(prefix: string) {
    super({
      initialCounter: `${prefix}-1`,
      idGenerator: (current: string) => {
        const num = parseInt(current.split('-')[1]);
        return `${prefix}-${num + 1}`;
      },
    });
  }
}

// Usage
const userCollection = collection()
  .model(userModel)
  .identityManager(new UUIDIdentityManager())
  .create();

const postCollection = collection()
  .model(postModel)
  .identityManager(new PrefixedIdentityManager('post'))
  .create();
// Creates IDs like: "post-1", "post-2", "post-3"
```

**Identity Manager Constructor Options:**
- `initialCounter` - The starting ID value
- `initialUsedIds` - Array of pre-existing IDs to avoid
- `idGenerator` - Custom function to generate the next ID from current

**Available Methods:**
- `fetch()` - Get next ID and mark as used
- `get()` - Peek at next ID without marking as used
- `set(id)` - Mark an ID as used
- `inc()` - Increment the counter
- `reset()` - Reset to initial state

### Differences from MirageJS

| Feature | MirageJS | This ORM |
|---------|----------|----------|
| **API** | Separate `serializer` function | Built-in `.toJSON()` |
| **Key Formatting** | Automatic (camelCase/dash-case) | User-controlled |
| **Type Safety** | Limited | Full TypeScript support |
| **Configuration** | Serializer classes | Simple config objects |
| **Relationships** | Manual inclusion | Automatic with `include` |
| **Global Config** | No | Yes (schema-level) |

---

## Migration from Current MirageJS

If you're migrating from MirageJS, here are the key changes:

1. **Builder API**: Use `model()`, `factory()`, `collection()`, and `schema()` builders
2. **Relationships**: Define at collection level with `.relationships()`
3. **Serialization**: Use `.toJSON()` instead of separate serializers
4. **No Key Formatting**: Define your exact output structure via types
5. **Type Safety**: Fully typed throughout, define your own types

Example migration:

```typescript
// MirageJS (old)
Model.extend({
  user: belongsTo()
});

// This ORM (new)
collection()
  .model(postModel)
  .relationships({
    author: associations.belongsTo(userModel, { foreignKey: 'authorId' })
  })
  .create();
```

