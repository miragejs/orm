import { associations } from '@src/associations';
import { model } from '@src/model';

describe('associations', () => {
  // Test templates
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

  const userTemplate = model('user', 'users').attrs<UserAttrs>().create();
  const postTemplate = model('post', 'posts').attrs<PostAttrs>().create();
  const commentTemplate = model('comment', 'comments').attrs<CommentAttrs>().create();

  describe('belongsTo', () => {
    it('should create a belongsTo relationship with default foreign key', () => {
      const relationship = associations.belongsTo(userTemplate);

      expect(relationship.type).toBe('belongsTo');
      expect(relationship.targetModel).toBe(userTemplate);
      expect(relationship.foreignKey).toBe('userId');
    });

    it('should create a belongsTo relationship with custom foreign key', () => {
      const relationship = associations.belongsTo(userTemplate, { foreignKey: 'authorId' });

      expect(relationship.type).toBe('belongsTo');
      expect(relationship.targetModel).toBe(userTemplate);
      expect(relationship.foreignKey).toBe('authorId');
    });

    it('should work with different template types', () => {
      const userRelationship = associations.belongsTo(userTemplate);
      const postRelationship = associations.belongsTo(postTemplate);

      expect(userRelationship.foreignKey).toBe('userId');
      expect(postRelationship.foreignKey).toBe('postId');
    });

    it('should preserve target template information', () => {
      const relationship = associations.belongsTo(userTemplate);

      expect(relationship.targetModel.modelName).toBe('user');
      expect(relationship.targetModel.collectionName).toBe('users');
    });
  });

  describe('hasMany', () => {
    it('should create a hasMany relationship with default foreign key', () => {
      const relationship = associations.hasMany(postTemplate);

      expect(relationship.type).toBe('hasMany');
      expect(relationship.targetModel).toBe(postTemplate);
      expect(relationship.foreignKey).toBe('postIds');
    });

    it('should create a hasMany relationship with custom foreign key', () => {
      const relationship = associations.hasMany(postTemplate, { foreignKey: 'myPostIds' });

      expect(relationship.type).toBe('hasMany');
      expect(relationship.targetModel).toBe(postTemplate);
      expect(relationship.foreignKey).toBe('myPostIds');
    });

    it('should work with different template types', () => {
      const postRelationship = associations.hasMany(postTemplate);
      const commentRelationship = associations.hasMany(commentTemplate);

      expect(postRelationship.foreignKey).toBe('postIds');
      expect(commentRelationship.foreignKey).toBe('commentIds');
    });

    it('should preserve target template information', () => {
      const relationship = associations.hasMany(postTemplate);

      expect(relationship.targetModel.modelName).toBe('post');
      expect(relationship.targetModel.collectionName).toBe('posts');
    });
  });

  describe('integration with relationship definitions', () => {
    it('should create valid relationship configurations', () => {
      const userRelationships = {
        posts: associations.hasMany(postTemplate),
        profile: associations.belongsTo(userTemplate, { foreignKey: 'profileId' }),
      };

      const postRelationships = {
        author: associations.belongsTo(userTemplate, { foreignKey: 'authorId' }),
        comments: associations.hasMany(commentTemplate),
      };

      // Verify structure
      expect(userRelationships.posts.type).toBe('hasMany');
      expect(userRelationships.posts.targetModel).toBe(postTemplate);
      expect(userRelationships.posts.foreignKey).toBe('postIds');

      expect(userRelationships.profile.type).toBe('belongsTo');
      expect(userRelationships.profile.targetModel).toBe(userTemplate);
      expect(userRelationships.profile.foreignKey).toBe('profileId');

      expect(postRelationships.author.type).toBe('belongsTo');
      expect(postRelationships.author.targetModel).toBe(userTemplate);
      expect(postRelationships.author.foreignKey).toBe('authorId');

      expect(postRelationships.comments.type).toBe('hasMany');
      expect(postRelationships.comments.targetModel).toBe(commentTemplate);
      expect(postRelationships.comments.foreignKey).toBe('commentIds');
    });

    it('should work with complex relationship hierarchies', () => {
      const relationships = {
        // Self-referential relationship
        parent: associations.belongsTo(userTemplate, { foreignKey: 'parentId' }),
        children: associations.hasMany(userTemplate, { foreignKey: 'childIds' }),

        // Cross-model relationships
        posts: associations.hasMany(postTemplate),
        favoritePost: associations.belongsTo(postTemplate, { foreignKey: 'favoritePostId' }),
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
        posts: associations.hasMany(postTemplate),
        author: associations.belongsTo(userTemplate, { foreignKey: 'authorId' }),
      };

      expect(relationships.posts.targetModel.modelName).toBe('post');
      expect(relationships.author.targetModel.modelName).toBe('user');
    });

    it('should infer foreign key types correctly', () => {
      const belongsToRel = associations.belongsTo(userTemplate);
      const hasManyRel = associations.hasMany(postTemplate);

      // Default foreign keys should be properly typed
      expect(belongsToRel.foreignKey).toBe('userId');
      expect(hasManyRel.foreignKey).toBe('postIds');
    });
  });
});
