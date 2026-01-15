import { model } from '@src/model';

import relations from '../relations';

// Define test model attributes
interface UserAttrs {
  id: string;
  name: string;
  email: string;
}

interface PostAttrs {
  id: number;
  title: string;
  content: string;
  authorId: string;
}

interface CommentAttrs {
  id: string;
  content: string;
  postId: number;
}

// Define test models
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .build();
const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<PostAttrs>()
  .build();
const commentModel = model()
  .name('comment')
  .collection('comments')
  .attrs<CommentAttrs>()
  .build();

describe('relations', () => {
  describe('belongsTo', () => {
    it('should create a belongsTo relationship with default foreign key', () => {
      const relationship = relations.belongsTo(userModel);
      expect(relationship.type).toBe('belongsTo');
      expect(relationship.targetModel).toBe(userModel);
      expect(relationship.foreignKey).toBe('userId');
    });

    it('should create a belongsTo relationship with custom foreign key', () => {
      const relationship = relations.belongsTo(userModel, {
        foreignKey: 'authorId',
      });
      expect(relationship.type).toBe('belongsTo');
      expect(relationship.targetModel).toBe(userModel);
      expect(relationship.foreignKey).toBe('authorId');
    });

    it('should work with different template types', () => {
      const userRelationship = relations.belongsTo(userModel);
      const postRelationship = relations.belongsTo(postModel);
      expect(userRelationship.foreignKey).toBe('userId');
      expect(postRelationship.foreignKey).toBe('postId');
    });

    it('should preserve target template information', () => {
      const relationship = relations.belongsTo(userModel);
      expect(relationship.targetModel.modelName).toBe('user');
      expect(relationship.targetModel.collectionName).toBe('users');
    });

    it('should use default collectionName from target model', () => {
      const relationship = relations.belongsTo(userModel);
      expect(relationship.collectionName).toBe('users');
    });

    it('should accept custom collectionName option', () => {
      const relationship = relations.belongsTo(userModel, {
        collectionName: 'authors',
      });
      expect(relationship.collectionName).toBe('authors');
    });

    it('should accept collectionName with other options', () => {
      const relationship = relations.belongsTo(userModel, {
        foreignKey: 'authorId',
        inverse: 'posts',
        collectionName: 'authors',
      });
      expect(relationship.foreignKey).toBe('authorId');
      expect(relationship.inverse).toBe('posts');
      expect(relationship.collectionName).toBe('authors');
    });
  });

  describe('hasMany', () => {
    it('should create a hasMany relationship with default foreign key', () => {
      const relationship = relations.hasMany(postModel);
      expect(relationship.type).toBe('hasMany');
      expect(relationship.targetModel).toBe(postModel);
      expect(relationship.foreignKey).toBe('postIds');
    });

    it('should create a hasMany relationship with custom foreign key', () => {
      const relationship = relations.hasMany(postModel, {
        foreignKey: 'myPostIds',
      });
      expect(relationship.type).toBe('hasMany');
      expect(relationship.targetModel).toBe(postModel);
      expect(relationship.foreignKey).toBe('myPostIds');
    });

    it('should work with different template types', () => {
      const postRelationship = relations.hasMany(postModel);
      const commentRelationship = relations.hasMany(commentModel);
      expect(postRelationship.foreignKey).toBe('postIds');
      expect(commentRelationship.foreignKey).toBe('commentIds');
    });

    it('should preserve target template information', () => {
      const relationship = relations.hasMany(postModel);
      expect(relationship.targetModel.modelName).toBe('post');
      expect(relationship.targetModel.collectionName).toBe('posts');
    });

    it('should use default collectionName from target model', () => {
      const relationship = relations.hasMany(postModel);
      expect(relationship.collectionName).toBe('posts');
    });

    it('should accept custom collectionName option', () => {
      const relationship = relations.hasMany(postModel, {
        collectionName: 'articles',
      });
      expect(relationship.collectionName).toBe('articles');
    });

    it('should accept collectionName with other options', () => {
      const relationship = relations.hasMany(postModel, {
        foreignKey: 'articleIds',
        inverse: 'author',
        collectionName: 'articles',
      });
      expect(relationship.foreignKey).toBe('articleIds');
      expect(relationship.inverse).toBe('author');
      expect(relationship.collectionName).toBe('articles');
    });
  });

  describe('Integration with relationship definitions', () => {
    it('should create valid relationship configurations', () => {
      const userRelationships = {
        posts: relations.hasMany(postModel),
        profile: relations.belongsTo(userModel, { foreignKey: 'profileId' }),
      };

      const postRelationships = {
        author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        comments: relations.hasMany(commentModel),
      };

      expect(userRelationships.posts.type).toBe('hasMany');
      expect(userRelationships.posts.targetModel).toBe(postModel);
      expect(userRelationships.posts.foreignKey).toBe('postIds');

      expect(userRelationships.profile.type).toBe('belongsTo');
      expect(userRelationships.profile.targetModel).toBe(userModel);
      expect(userRelationships.profile.foreignKey).toBe('profileId');

      expect(postRelationships.author.type).toBe('belongsTo');
      expect(postRelationships.author.targetModel).toBe(userModel);
      expect(postRelationships.author.foreignKey).toBe('authorId');

      expect(postRelationships.comments.type).toBe('hasMany');
      expect(postRelationships.comments.targetModel).toBe(commentModel);
      expect(postRelationships.comments.foreignKey).toBe('commentIds');
    });

    it('should work with complex relationship hierarchies', () => {
      const relationships = {
        // Self-referential relationship
        parent: relations.belongsTo(userModel, { foreignKey: 'parentId' }),
        children: relations.hasMany(userModel, { foreignKey: 'childIds' }),

        // Cross-model relationships
        posts: relations.hasMany(postModel),
        favoritePost: relations.belongsTo(postModel, {
          foreignKey: 'favoritePostId',
        }),
      };

      expect(relationships.parent.type).toBe('belongsTo');
      expect(relationships.parent.foreignKey).toBe('parentId');
      expect(relationships.children.type).toBe('hasMany');
      expect(relationships.children.foreignKey).toBe('childIds');
      expect(relationships.posts.type).toBe('hasMany');
      expect(relationships.posts.foreignKey).toBe('postIds');
      expect(relationships.favoritePost.type).toBe('belongsTo');
      expect(relationships.favoritePost.foreignKey).toBe('favoritePostId');
    });
  });

  describe('inverse option', () => {
    describe('belongsTo', () => {
      it('should create relationship without inverse (auto-detect)', () => {
        const rel = relations.belongsTo(userModel);
        expect(rel.inverse).toBeUndefined();
      });

      it('should create relationship with explicit inverse', () => {
        const rel = relations.belongsTo(userModel, {
          inverse: 'authoredPosts',
        });
        expect(rel.inverse).toBe('authoredPosts');
      });

      it('should create relationship with inverse disabled', () => {
        const rel = relations.belongsTo(userModel, { inverse: null });
        expect(rel.inverse).toBe(null);
      });

      it('should accept both foreignKey and inverse options', () => {
        const rel = relations.belongsTo(userModel, {
          foreignKey: 'creatorId',
          inverse: 'createdPosts',
        });
        expect(rel.foreignKey).toBe('creatorId');
        expect(rel.inverse).toBe('createdPosts');
      });
    });

    describe('hasMany', () => {
      it('should create relationship without inverse (auto-detect)', () => {
        const rel = relations.hasMany(postModel);
        expect(rel.inverse).toBeUndefined();
      });

      it('should create relationship with explicit inverse', () => {
        const rel = relations.hasMany(postModel, { inverse: 'author' });
        expect(rel.inverse).toBe('author');
      });

      it('should create relationship with inverse disabled', () => {
        const rel = relations.hasMany(postModel, { inverse: null });
        expect(rel.inverse).toBe(null);
      });

      it('should accept both foreignKey and inverse options', () => {
        const rel = relations.hasMany(postModel, {
          foreignKey: 'articleIds',
          inverse: 'writer',
        });
        expect(rel.foreignKey).toBe('articleIds');
        expect(rel.inverse).toBe('writer');
      });
    });
  });
});
