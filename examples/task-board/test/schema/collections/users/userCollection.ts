import { associations, collection } from 'miragejs-orm';
import { commentModel, taskModel, teamModel, userModel } from '@test/schema/models';
import type { AppCollections } from '@test/schema/types';
import { userFactory } from './userFactory';

export const usersCollection = collection<AppCollections>()
  .model(userModel)
  .factory(userFactory)
  .relationships({
    comments: associations.hasMany(commentModel),
    tasks: associations.hasMany(taskModel),
    team: associations.belongsTo(teamModel),
  })
  .serializer({
    include: ['team'],
    embed: true,
  })
  .seeds({
    default(schema) {
      // Get DevX team
      const devXTeam = schema.teams.find({ name: 'DevX' });

      // Create current user
      schema.users.create({
        email: 'john.doe@example.com',
        name: 'John Doe',
        bio: 'Software Engineer passionate about building great user experiences',
        team: devXTeam,
      });

      // Create manager user
      schema.users.create('manager', {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        bio: 'Engineering Team Lead with focus on team growth and delivery',
        team: devXTeam,
      });
    },
  })
  .create();
