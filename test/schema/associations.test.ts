import { associations } from '@src/schema';
import { token } from '@src/token';

describe('associations', () => {
  // Test tokens
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

  const userToken = token('user', 'users').attrs<UserAttrs>().create();
  const postToken = token('post', 'posts').attrs<PostAttrs>().create();
  const commentToken = token('comment', 'comments').attrs<CommentAttrs>().create();

  describe('belongsTo', () => {
    it('should create a belongsTo relationship with default foreign key', () => {
      const relationship = associations.belongsTo(userToken);

      expect(relationship.type).toBe('belongsTo');
      expect(relationship.targetToken).toBe(userToken);
      expect(relationship.foreignKey).toBe('userId');
    });

    it('should create a belongsTo relationship with custom foreign key', () => {
      const relationship = associations.belongsTo(userToken, { foreignKey: 'authorId' });

      expect(relationship.type).toBe('belongsTo');
      expect(relationship.targetToken).toBe(userToken);
      expect(relationship.foreignKey).toBe('authorId');
    });

    it('should work with different token types', () => {
      const userRelationship = associations.belongsTo(userToken);
      const postRelationship = associations.belongsTo(postToken);

      expect(userRelationship.foreignKey).toBe('userId');
      expect(postRelationship.foreignKey).toBe('postId');
    });

    it('should preserve target token information', () => {
      const relationship = associations.belongsTo(userToken);

      expect(relationship.targetToken.modelName).toBe('user');
      expect(relationship.targetToken.collectionName).toBe('users');
    });
  });

  describe('hasMany', () => {
    it('should create a hasMany relationship with default foreign key', () => {
      const relationship = associations.hasMany(postToken);

      expect(relationship.type).toBe('hasMany');
      expect(relationship.targetToken).toBe(postToken);
      expect(relationship.foreignKey).toBe('postIds');
    });

    it('should create a hasMany relationship with custom foreign key', () => {
      const relationship = associations.hasMany(postToken, { foreignKey: 'myPostIds' });

      expect(relationship.type).toBe('hasMany');
      expect(relationship.targetToken).toBe(postToken);
      expect(relationship.foreignKey).toBe('myPostIds');
    });

    it('should work with different token types', () => {
      const postRelationship = associations.hasMany(postToken);
      const commentRelationship = associations.hasMany(commentToken);

      expect(postRelationship.foreignKey).toBe('postIds');
      expect(commentRelationship.foreignKey).toBe('commentIds');
    });

    it('should preserve target token information', () => {
      const relationship = associations.hasMany(postToken);

      expect(relationship.targetToken.modelName).toBe('post');
      expect(relationship.targetToken.collectionName).toBe('posts');
    });
  });

  describe('integration with relationship definitions', () => {
    it('should create valid relationship configurations', () => {
      const userRelationships = {
        posts: associations.hasMany(postToken),
        profile: associations.belongsTo(userToken, { foreignKey: 'profileId' }),
      };

      const postRelationships = {
        author: associations.belongsTo(userToken, { foreignKey: 'authorId' }),
        comments: associations.hasMany(commentToken),
      };

      // Verify structure
      expect(userRelationships.posts.type).toBe('hasMany');
      expect(userRelationships.posts.targetToken).toBe(postToken);
      expect(userRelationships.posts.foreignKey).toBe('postIds');

      expect(userRelationships.profile.type).toBe('belongsTo');
      expect(userRelationships.profile.targetToken).toBe(userToken);
      expect(userRelationships.profile.foreignKey).toBe('profileId');

      expect(postRelationships.author.type).toBe('belongsTo');
      expect(postRelationships.author.targetToken).toBe(userToken);
      expect(postRelationships.author.foreignKey).toBe('authorId');

      expect(postRelationships.comments.type).toBe('hasMany');
      expect(postRelationships.comments.targetToken).toBe(commentToken);
      expect(postRelationships.comments.foreignKey).toBe('commentIds');
    });

    it('should work with complex relationship hierarchies', () => {
      const relationships = {
        // Self-referential relationship
        parent: associations.belongsTo(userToken, { foreignKey: 'parentId' }),
        children: associations.hasMany(userToken, { foreignKey: 'childIds' }),

        // Cross-model relationships
        posts: associations.hasMany(postToken),
        favoritePost: associations.belongsTo(postToken, { foreignKey: 'favoritePostId' }),
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

  describe('type safety', () => {
    it('should maintain proper types for relationship configurations', () => {
      // This should compile without type errors
      const relationships = {
        posts: associations.hasMany(postToken),
        author: associations.belongsTo(userToken, { foreignKey: 'authorId' }),
      };

      expect(relationships.posts.targetToken.modelName).toBe('post');
      expect(relationships.author.targetToken.modelName).toBe('user');
    });

    it('should infer foreign key types correctly', () => {
      const belongsToRel = associations.belongsTo(userToken);
      const hasManyRel = associations.hasMany(postToken);

      // Default foreign keys should be properly typed
      expect(belongsToRel.foreignKey).toBe('userId');
      expect(hasManyRel.foreignKey).toBe('postIds');
    });
  });
});
