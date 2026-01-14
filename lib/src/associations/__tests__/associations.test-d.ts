import type {
  Association,
  AssociationTraitsAndDefaults,
  CreateAssociation,
  CreateManyAssociation,
  FactoryAssociations,
  LinkAssociation,
  LinkManyAssociation,
} from '@src/associations';
import { model } from '@src/model';
import {
  belongsTo,
  hasMany,
  type BelongsTo,
  type HasMany,
} from '@src/relations';
import type { CollectionConfig } from '@src/schema';
import { expectTypeOf, test } from 'vitest';

// Test model attributes
interface UserAttrs {
  id: string;
  name: string;
  email: string;
}

interface PostAttrs {
  id: number;
  title: string;
  content: string;
}

interface CommentAttrs {
  id: string;
  content: string;
}

// Test models
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

// Test schema type
type TestSchema = {
  users: CollectionConfig<typeof userModel>;
  posts: CollectionConfig<typeof postModel>;
  comments: CollectionConfig<typeof commentModel>;
};

test('BelongsTo relationship should work correctly', () => {
  const relation: BelongsTo<typeof userModel, 'userId'> = {
    type: 'belongsTo',
    targetModel: userModel,
    foreignKey: 'userId',
    collectionName: 'users',
  };

  expectTypeOf(relation.type).toEqualTypeOf<'belongsTo'>();
  expectTypeOf(relation.targetModel).toEqualTypeOf<typeof userModel>();
  expectTypeOf(relation.foreignKey).toEqualTypeOf<'userId'>();
});

test('BelongsTo with custom foreign key should work', () => {
  const relation: BelongsTo<typeof userModel, 'ownerId'> = {
    type: 'belongsTo',
    targetModel: userModel,
    foreignKey: 'ownerId',
    collectionName: 'users',
  };

  expectTypeOf(relation.foreignKey).toEqualTypeOf<'ownerId'>();
});

test('HasMany relationship should work correctly', () => {
  const relation: HasMany<typeof postModel, 'postIds'> = {
    type: 'hasMany',
    targetModel: postModel,
    foreignKey: 'postIds',
    collectionName: 'posts',
  };

  expectTypeOf(relation.type).toEqualTypeOf<'hasMany'>();
  expectTypeOf(relation.targetModel).toEqualTypeOf<typeof postModel>();
  expectTypeOf(relation.foreignKey).toEqualTypeOf<'postIds'>();
});

test('HasMany with custom foreign key should work', () => {
  const relation: HasMany<typeof postModel, 'articleIds'> = {
    type: 'hasMany',
    targetModel: postModel,
    foreignKey: 'articleIds',
    collectionName: 'posts',
  };

  expectTypeOf(relation.foreignKey).toEqualTypeOf<'articleIds'>();
});

test('Association union should include all factory association types', () => {
  const createAssoc: Association<typeof userModel> = {
    type: 'create',
    model: userModel,
  };

  expectTypeOf(createAssoc.model).toEqualTypeOf(userModel);

  const createManyAssoc: Association<typeof userModel> = {
    type: 'createMany',
    model: userModel,
    count: 5,
  };

  expectTypeOf(createManyAssoc.model).toEqualTypeOf(userModel);

  const linkAssoc: Association<typeof userModel> = {
    type: 'link',
    model: userModel,
  };

  expectTypeOf(linkAssoc.model).toEqualTypeOf(userModel);

  const linkManyAssoc: Association<typeof userModel> = {
    type: 'linkMany',
    model: userModel,
    count: 3,
  };

  expectTypeOf(linkManyAssoc.model).toEqualTypeOf(userModel);
});

test('CreateAssociation type should work correctly', () => {
  const assoc: CreateAssociation<typeof userModel> = {
    type: 'create',
    model: userModel,
  };

  expectTypeOf(assoc).toEqualTypeOf<CreateAssociation<typeof userModel>>();
});

test('CreateManyAssociation type should work correctly', () => {
  // Count mode
  const countAssoc: CreateManyAssociation<typeof postModel> = {
    type: 'createMany',
    model: postModel,
    count: 5,
  };

  expectTypeOf(countAssoc).toEqualTypeOf<
    CreateManyAssociation<typeof postModel>
  >();
  expectTypeOf(countAssoc.count).toEqualTypeOf<number | undefined>();
  expectTypeOf(countAssoc.models).toEqualTypeOf<
    AssociationTraitsAndDefaults[] | undefined
  >();

  // Array mode
  const arrayAssoc: CreateManyAssociation<typeof postModel> = {
    type: 'createMany',
    model: postModel,
    models: [[{ title: 'First' }], [{ title: 'Second' }]],
  };

  expectTypeOf(arrayAssoc).toEqualTypeOf<
    CreateManyAssociation<typeof postModel>
  >();
  expectTypeOf(arrayAssoc.count).toEqualTypeOf<number | undefined>();
  expectTypeOf(arrayAssoc.models).toEqualTypeOf<
    AssociationTraitsAndDefaults[] | undefined
  >();
});

test('LinkAssociation type should work correctly', () => {
  const assoc: LinkAssociation<typeof userModel> = {
    type: 'link',
    model: userModel,
  };

  expectTypeOf(assoc).toEqualTypeOf<LinkAssociation<typeof userModel>>();
});

test('LinkManyAssociation type should work correctly', () => {
  const assoc: LinkManyAssociation<typeof postModel> = {
    type: 'linkMany',
    model: postModel,
    count: 3,
  };

  expectTypeOf(assoc).toEqualTypeOf<LinkManyAssociation<typeof postModel>>();
});

test('FactoryAssociations record type should work correctly', () => {
  const assoc: FactoryAssociations<typeof postModel, TestSchema> = {
    author: {
      type: 'create',
      model: userModel,
    },
    comments: {
      type: 'createMany',
      model: commentModel,
      count: 5,
    },
  };

  // Type is verified by the successful assignment above
  expectTypeOf(assoc).toBeObject();
});

// ============================================================================
// INVERSE OPTION TESTS
// ============================================================================

test('BelongsTo should accept inverse option', () => {
  const rel1 = belongsTo(userModel);
  expectTypeOf(rel1.inverse).toEqualTypeOf<string | null | undefined>();
  expectTypeOf(rel1.inverse).toBeNullable();

  const rel2 = belongsTo(userModel, { inverse: 'posts' });
  expectTypeOf(rel2.inverse).toEqualTypeOf<string | null | undefined>();

  const rel3 = belongsTo(userModel, { inverse: null });
  expectTypeOf(rel3.inverse).toEqualTypeOf<string | null | undefined>();
});

test('HasMany should accept inverse option', () => {
  const rel1 = hasMany(postModel);
  expectTypeOf(rel1.inverse).toEqualTypeOf<string | null | undefined>();
  expectTypeOf(rel1.inverse).toBeNullable();

  const rel2 = hasMany(postModel, { inverse: 'author' });
  expectTypeOf(rel2.inverse).toEqualTypeOf<string | null | undefined>();

  const rel3 = hasMany(postModel, { inverse: null });
  expectTypeOf(rel3.inverse).toEqualTypeOf<string | null | undefined>();
});

test('Inverse option should work with foreignKey option', () => {
  const rel1 = belongsTo(userModel, {
    foreignKey: 'creatorId',
    inverse: 'createdPosts',
  });
  expectTypeOf(rel1.foreignKey).toBeString();
  expectTypeOf(rel1.inverse).toEqualTypeOf<string | null | undefined>();

  const rel2 = hasMany(postModel, {
    foreignKey: 'articleIds',
    inverse: 'author',
  });
  expectTypeOf(rel2.foreignKey).toBeString();
  expectTypeOf(rel2.inverse).toEqualTypeOf<string | null | undefined>();
});
