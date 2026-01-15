import { LogLevel, schema } from 'miragejs-orm';
import {
  commentsCollection,
  tasksCollection,
  teamsCollection,
  usersCollection,
} from './collections';
import { TestSchema } from './types';

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
    level: LogLevel.DEBUG,
  })
  .build();
