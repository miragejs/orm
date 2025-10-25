import type {
  Association,
  BelongsTo,
  CreateAssociation,
  CreateManyAssociation,
  FactoryAssociations,
  HasMany,
  LinkAssociation,
  LinkManyAssociation,
} from '@src/associations';
import { model } from '@src/model';
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
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();
const commentModel = model().name('comment').collection('comments').attrs<CommentAttrs>().create();

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
  };

  expectTypeOf(relation.foreignKey).toEqualTypeOf<'ownerId'>();
});

test('HasMany relationship should work correctly', () => {
  const relation: HasMany<typeof postModel, 'postIds'> = {
    type: 'hasMany',
    targetModel: postModel,
    foreignKey: 'postIds',
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
  const assoc: CreateManyAssociation<typeof postModel> = {
    type: 'createMany',
    model: postModel,
    count: 5,
  };

  expectTypeOf(assoc).toEqualTypeOf<CreateManyAssociation<typeof postModel>>();
  expectTypeOf(assoc.count).toEqualTypeOf<number>();
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
