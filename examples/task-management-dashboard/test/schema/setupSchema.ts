import { schema } from 'miragejs-orm';
import {
  commentsCollection,
  tasksCollection,
  teamsCollection,
  usersCollection,
} from './collections';
import type { AppSchema } from './types';

/**
 * Sets up and initializes the application schema with all collections
 * @returns The initialized schema instance
 */
export function setupSchema(): AppSchema {
  const appSchema = schema()
    .collections({
      comments: commentsCollection,
      tasks: tasksCollection,
      teams: teamsCollection,
      users: usersCollection,
    })
    .setup();

  console.log('✅ Schema initialized:', appSchema.db.dump());

  return appSchema;
}
