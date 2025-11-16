import { schema, LogLevel } from 'miragejs-orm';
import {
  commentsCollection,
  tasksCollection,
  teamsCollection,
  usersCollection,
} from './collections';

/**
 * Development schema instance with logging enabled
 * Global serializer configured with root wrapping for all collections
 */
export const devSchema = schema()
  .collections({
    teams: teamsCollection,
    users: usersCollection,
    tasks: tasksCollection,
    comments: commentsCollection,
  })
  .logging({
    enabled: true,
    level: LogLevel.DEBUG,
  })
  .serializer({ root: true })
  .setup();
