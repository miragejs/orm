import { collection, associations } from 'miragejs-orm';
import { taskModel, userModel, teamModel, commentModel } from '@test/schema/models';
import type { AppCollections } from '@test/schema/types';
import { taskFactory } from './taskFactory';

export const tasksCollection = collection<AppCollections>()
  .model(taskModel)
  .factory(taskFactory)
  .relationships({
    assignee: associations.belongsTo(userModel, { foreignKey: 'assigneeId' }),
    team: associations.belongsTo(teamModel),
    comments: associations.hasMany(commentModel),
  })
  .seeds({
    default: (schema) => {
      // Get regular user and DevX team
      const currentUser = schema.users.find({ email: 'john.doe@example.com' });
      const devXTeam = schema.teams.find({ name: 'DevX' });

      if (!currentUser || !devXTeam) {
        throw new Error(
          'Regular user and DevX team must be created before loading task seeds',
        );
      }

      const associationAttrs = {
        assigneeId: currentUser.id,
        teamId: devXTeam.id,
      };

      // Create a variety of tasks using factory traits
      schema.tasks.createMany([
        // TO_DO tasks
        ['todo', 'highPriority', associationAttrs],
        ['todo', associationAttrs],
        ['todo', 'lowPriority', associationAttrs],
        // IN_PROGRESS tasks
        ['inProgress', 'highPriority', associationAttrs],
        ['inProgress', associationAttrs],
        // REVIEW tasks
        ['review', 'highPriority', associationAttrs],
        ['review', associationAttrs],
        // DONE tasks
        ['done', 'highPriority', associationAttrs],
        ['done', 'lowPriority', associationAttrs],
        // Urgent/Overdue task
        ['todo', 'overdue', associationAttrs],
      ]);
    },
  })
  .create();
