import { collection, relations } from 'miragejs-orm';
import { commentModel, taskModel, teamModel, userModel } from '@test/schema/models';
import type { TestCollections } from '@test/schema/types';
import { userFactory } from './userFactory';

export const usersCollection = collection<TestCollections>()
  .model(userModel)
  .factory(userFactory)
  .relationships({
    comments: relations.hasMany(commentModel),
    tasks: relations.hasMany(taskModel),
    team: relations.belongsTo(teamModel, { inverse: 'members' }),
  })
  .serializer({
    with: {
      team: { select: ['id', 'name', 'description', 'department', 'slug'] },
    },
    relationsMode: 'embedded',
  })
  .seeds((schema) => {
    // Get DevX team
    const currentTeam = schema.teams.first()!;

    // Create current user
    schema.users.create({
      email: 'john.doe@example.com',
      name: 'John Doe',
      bio: 'Software Engineer passionate about building great user experiences',
      team: currentTeam,
    });
    currentTeam.reload();

    // Create manager user
    const managerUser = schema.users.create('manager', {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      bio: 'Engineering Team Lead with focus on team growth and delivery',
      team: currentTeam,
    });
    currentTeam.update({ manager: managerUser });
  })
  .build();
