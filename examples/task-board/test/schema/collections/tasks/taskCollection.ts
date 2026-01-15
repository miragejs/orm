import { collection, relations, type PartialModelAttrs } from 'miragejs-orm';
import {
  taskModel,
  userModel,
  teamModel,
  commentModel,
  type TaskModel,
} from '@test/schema/models';
import type { TestCollections } from '@test/schema/types';
import { taskFactory } from './taskFactory';

export const tasksCollection = collection<TestCollections>()
  .model(taskModel)
  .factory(taskFactory)
  .relationships({
    assignee: relations.belongsTo(userModel, {
      foreignKey: 'assigneeId',
    }),
    comments: relations.hasMany(commentModel),
    creator: relations.belongsTo(userModel, {
      foreignKey: 'creatorId',
    }),
    team: relations.belongsTo(teamModel),
  })
  .serializer({
    root: true,
    with: {
      assignee: { select: ['avatar', 'email', 'id', 'name', 'role'] },
      creator: { select: ['avatar', 'email', 'id', 'name', 'role'] },
      team: { select: ['department', 'description', 'id', 'name'] },
    },
    relationsMode: 'embedded',
  })
  .seeds((schema) => {
    // Get users and DevX team
    const devXTeam = schema.teams.find({ name: 'DevX' });
    const currentUser = schema.users.find({ email: 'john.doe@example.com' });
    const managerUser = schema.users.find({ email: 'jane.smith@example.com' });

    if (!currentUser || !managerUser || !devXTeam) {
      throw new Error('Users and DevX team must be created before loading task seeds');
    }

    const associationAttrs: PartialModelAttrs<TaskModel> = {
      assigneeId: currentUser.id,
      creatorId: managerUser.id,
      teamId: devXTeam.id,
    };

    // Create a variety of tasks using factory traits
    // TO_DO tasks
    schema.tasks.create('todo', 'highPriority', associationAttrs);
    schema.tasks.create('todo', associationAttrs);
    schema.tasks.create('todo', 'lowPriority', associationAttrs);

    // IN_PROGRESS tasks (with comments)
    schema.tasks.create('inProgress', 'highPriority', 'withComments', associationAttrs);
    schema.tasks.create('inProgress', 'withComments', associationAttrs);

    // REVIEW tasks (with comments)
    schema.tasks.create('review', 'highPriority', 'withComments', associationAttrs);
    schema.tasks.create('review', associationAttrs);

    // DONE tasks
    schema.tasks.create('done', 'highPriority', associationAttrs);
    schema.tasks.create('done', 'lowPriority', associationAttrs);

    // Urgent/Overdue task
    schema.tasks.create('todo', 'overdue', associationAttrs);
  })
  .build();
