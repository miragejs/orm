import { setupServer } from 'msw/node';
import { describe, expect, test, beforeAll, afterAll, afterEach } from '@test/context';
import { teamHandlers } from '@test/server/handlers';
import { memberOptionSerializer } from '@test/schema/collections/users';
import { clearUserCookie, setUserCookie } from '@test/utils';
import { TaskPriority, TaskStatus } from '@shared/enums';
import { getTeamTasks } from './getTeamTasks';

const server = setupServer(...teamHandlers);

describe('getTeamTasks', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('returns tasks with filters, sorting, and pagination metadata', async ({
    schema,
  }) => {
    const team = schema.teams.create('withManager');
    const { manager } = team;
    setUserCookie(manager.id);

    // Create tasks for the team
    const assignee = schema.users.create({ team });
    schema.tasks.createMany(3, {
      assignee,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
    });

    const params = new URLSearchParams();
    params.append('assigneeId', assignee.id);
    params.append('status', TaskStatus.TODO);
    params.append('priority', TaskPriority.HIGH);
    params.append('sortBy', 'title');
    params.append('sortOrder', 'asc');
    params.append('page', '0');
    params.append('pageSize', '10');

    const result = await getTeamTasks(params);

    expect(result.tasks).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.filters).toMatchObject({
      assigneeId: [assignee.id],
      status: [TaskStatus.TODO],
      priority: [TaskPriority.HIGH],
    });
    expect(result.sortBy).toBe('title');
    expect(result.sortOrder).toBe('asc');
    expect(result.page).toBe(0);
    expect(result.pageSize).toBe(10);
  });

  test('returns team members as filter options', async ({ schema }) => {
    const team = schema.teams.create('withManager');
    const { manager } = team;
    setUserCookie(manager.id);

    schema.users.createMany(2);
    team.reload();

    const memberOptions = team.members.serialize(memberOptionSerializer);

    const result = await getTeamTasks();

    expect(result.memberOptions).toEqual(memberOptions);
  });
});
