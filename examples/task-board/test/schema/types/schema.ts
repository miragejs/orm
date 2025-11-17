import type {
  BelongsTo,
  CollectionConfig,
  Factory,
  HasMany,
  SchemaInstance,
  Serializer,
} from 'miragejs-orm';
import type { UserModel, TeamModel, TaskModel, CommentModel } from '../models';

/**
 * Application collections configuration
 * Maps collection names to their CollectionConfig types
 */
export type AppCollections = {
  users: CollectionConfig<
    UserModel,
    {
      team: BelongsTo<TeamModel>;
      tasks: HasMany<TaskModel>;
      comments: HasMany<CommentModel>;
    },
    Factory<UserModel, 'manager' | 'withTasks', AppCollections>,
    Serializer<UserModel>,
    AppCollections
  >;
  teams: CollectionConfig<
    TeamModel,
    {
      members: HasMany<UserModel, 'memberIds'>;
      manager: BelongsTo<UserModel, 'managerId'>;
    },
    Factory<TeamModel, 'withManager' | 'withMembers', AppCollections>,
    Serializer<TeamModel>,
    AppCollections
  >;
  tasks: CollectionConfig<
    TaskModel,
    {
      assignee: BelongsTo<UserModel, 'assigneeId'>;
      team: BelongsTo<TeamModel>;
      comments: HasMany<CommentModel>;
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
      | 'withComments'
    >,
    Serializer<TaskModel>,
    AppCollections
  >;
  comments: CollectionConfig<
    CommentModel,
    {
      author: BelongsTo<UserModel, 'authorId'>;
      task: BelongsTo<TaskModel>;
    },
    Factory<CommentModel>
  >;
};

/**
 * Application schema instance type
 */
export type AppSchema = SchemaInstance<AppCollections>;
