import { model } from '@src/model';

import associations from '../associations';

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
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();
const commentModel = model().name('comment').collection('comments').attrs<CommentAttrs>().create();

describe('associations', () => {
  describe('belongsTo', () => {
    it('should create a belongsTo relationship with default foreign key', () => {
      const relationship = associations.belongsTo(userModel);
      expect(relationship.type).toBe('belongsTo');
      expect(relationship.targetModel).toBe(userModel);
      expect(relationship.foreignKey).toBe('userId');
    });

    it('should create a belongsTo relationship with custom foreign key', () => {
      const relationship = associations.belongsTo(userModel, { foreignKey: 'authorId' });
      expect(relationship.type).toBe('belongsTo');
      expect(relationship.targetModel).toBe(userModel);
      expect(relationship.foreignKey).toBe('authorId');
    });

    it('should work with different template types', () => {
      const userRelationship = associations.belongsTo(userModel);
      const postRelationship = associations.belongsTo(postModel);
      expect(userRelationship.foreignKey).toBe('userId');
      expect(postRelationship.foreignKey).toBe('postId');
    });

    it('should preserve target template information', () => {
      const relationship = associations.belongsTo(userModel);
      expect(relationship.targetModel.modelName).toBe('user');
      expect(relationship.targetModel.collectionName).toBe('users');
    });
  });

  describe('hasMany', () => {
    it('should create a hasMany relationship with default foreign key', () => {
      const relationship = associations.hasMany(postModel);
      expect(relationship.type).toBe('hasMany');
      expect(relationship.targetModel).toBe(postModel);
      expect(relationship.foreignKey).toBe('postIds');
    });

    it('should create a hasMany relationship with custom foreign key', () => {
      const relationship = associations.hasMany(postModel, { foreignKey: 'myPostIds' });
      expect(relationship.type).toBe('hasMany');
      expect(relationship.targetModel).toBe(postModel);
      expect(relationship.foreignKey).toBe('myPostIds');
    });

    it('should work with different template types', () => {
      const postRelationship = associations.hasMany(postModel);
      const commentRelationship = associations.hasMany(commentModel);
      expect(postRelationship.foreignKey).toBe('postIds');
      expect(commentRelationship.foreignKey).toBe('commentIds');
    });

    it('should preserve target template information', () => {
      const relationship = associations.hasMany(postModel);
      expect(relationship.targetModel.modelName).toBe('post');
      expect(relationship.targetModel.collectionName).toBe('posts');
    });
  });

  describe('Integration with relationship definitions', () => {
    it('should create valid relationship configurations', () => {
      const userRelationships = {
        posts: associations.hasMany(postModel),
        profile: associations.belongsTo(userModel, { foreignKey: 'profileId' }),
      };

      const postRelationships = {
        author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
        comments: associations.hasMany(commentModel),
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
        parent: associations.belongsTo(userModel, { foreignKey: 'parentId' }),
        children: associations.hasMany(userModel, { foreignKey: 'childIds' }),

        // Cross-model relationships
        posts: associations.hasMany(postModel),
        favoritePost: associations.belongsTo(postModel, { foreignKey: 'favoritePostId' }),
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
        const rel = associations.belongsTo(userModel);
        expect(rel.inverse).toBeUndefined();
      });

      it('should create relationship with explicit inverse', () => {
        const rel = associations.belongsTo(userModel, { inverse: 'authoredPosts' });
        expect(rel.inverse).toBe('authoredPosts');
      });

      it('should create relationship with inverse disabled', () => {
        const rel = associations.belongsTo(userModel, { inverse: null });
        expect(rel.inverse).toBe(null);
      });

      it('should accept both foreignKey and inverse options', () => {
        const rel = associations.belongsTo(userModel, {
          foreignKey: 'creatorId',
          inverse: 'createdPosts',
        });
        expect(rel.foreignKey).toBe('creatorId');
        expect(rel.inverse).toBe('createdPosts');
      });
    });

    describe('hasMany', () => {
      it('should create relationship without inverse (auto-detect)', () => {
        const rel = associations.hasMany(postModel);
        expect(rel.inverse).toBeUndefined();
      });

      it('should create relationship with explicit inverse', () => {
        const rel = associations.hasMany(postModel, { inverse: 'author' });
        expect(rel.inverse).toBe('author');
      });

      it('should create relationship with inverse disabled', () => {
        const rel = associations.hasMany(postModel, { inverse: null });
        expect(rel.inverse).toBe(null);
      });

      it('should accept both foreignKey and inverse options', () => {
        const rel = associations.hasMany(postModel, {
          foreignKey: 'articleIds',
          inverse: 'writer',
        });
        expect(rel.foreignKey).toBe('articleIds');
        expect(rel.inverse).toBe('writer');
      });
    });
  });
});
