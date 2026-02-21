import { LogLevel, schema } from 'miragejs-orm';
import {
  commentsCollection,
  tasksCollection,
  teamsCollection,
  usersCollection,
} from './collections';
import type {
  BelongsTo,
  CollectionConfig,
  Factory,
  HasMany,
  SchemaInstance,
} from 'miragejs-orm';
import type { CommentModel, TaskModel, TeamModel, UserModel } from './models';

/**
 * Test schema instance with logging disabled
 * Global serializer configured with root wrapping for all collections
 */
export const testSchema: TestSchema = schema()
  .collections({
    teams: teamsCollection,
    users: usersCollection,
    tasks: tasksCollection,
    comments: commentsCollection,
  })
  .logging({
    enabled: process.env.NODE_ENV === 'development',
    level: LogLevel.INFO,
  })
  .build();

/**
 * Test schema instance type
 */
export type TestSchema = SchemaInstance<TestCollections>;

/**
 * Test schema collections configuration
 * Maps collection names to their CollectionConfig types
 */
export type TestCollections = {
  users: CollectionConfig<
    UserModel,
    {
      comments: HasMany<CommentModel>;
      tasks: HasMany<TaskModel>;
      team: BelongsTo<TeamModel>;
    },
    Factory<UserModel, 'manager' | 'withTasks' | 'withTasksAndComments', TestCollections>,
    TestCollections
  >;
  teams: CollectionConfig<
    TeamModel,
    {
      manager: BelongsTo<UserModel, 'managerId'>;
      members: HasMany<UserModel, 'memberIds'>;
      tasks: HasMany<TaskModel>;
    },
    Factory<TeamModel, 'withManager' | 'withMembers', TestCollections>,
    TestCollections
  >;
  tasks: CollectionConfig<
    TaskModel,
    {
      assignee: BelongsTo<UserModel, 'assigneeId'>;
      comments: HasMany<CommentModel>;
      creator: BelongsTo<UserModel, 'creatorId'>;
      team: BelongsTo<TeamModel>;
    },
    Factory<
      TaskModel,
      | 'todo'
      | 'inProgress'
      | 'review'
      | 'done'
      | 'lowPriority'
      | 'highPriority'
      | 'urgent'
      | 'overdue'
      | 'withAssignee'
      | 'withComments',
      TestCollections
    >,
    TestCollections
  >;
  comments: CollectionConfig<
    CommentModel,
    {
      author: BelongsTo<UserModel, 'authorId'>;
      task: BelongsTo<TaskModel>;
    },
    Factory<CommentModel>,
    TestCollections
  >;
};
