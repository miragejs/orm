import { schema } from 'miragejs-orm';
import {
  commentsCollection,
  tasksCollection,
  teamsCollection,
  usersCollection,
} from './collections';

/**
 * Test schema instance with logging disabled
 * Global serializer configured with root wrapping for all collections
 */
export const testSchema = schema()
  .collections({
    teams: teamsCollection,
    users: usersCollection,
    tasks: tasksCollection,
    comments: commentsCollection,
  })
  .serializer({ root: true })
  .setup();
