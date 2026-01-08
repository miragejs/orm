import { delay, http, HttpResponse } from 'msw';
import { testSchema } from '@test/schema/testSchema';
import { parseTableQuery, type TableParams } from '@shared/utils';
import { ModelAttrs, Where } from 'miragejs-orm';
import { TaskModel } from '@test/schema/models';
import { collectTaskStats } from '@test/server/utils';
import type {
  MemberOption,
  MemberSortableColumn,
  SimpleUser,
  TaskFilters,
  TaskPriority,
  TaskSortableColumn,
  TaskStatus,
  Team,
} from '@shared/types';

/** Default pagination/sorting params for team members */
const defaultMembersParams: TableParams<MemberSortableColumn> = {
  page: 0,
  pageSize: 5,
  sortBy: 'name',
  sortOrder: 'asc',
};

/** Default pagination/sorting params for team tasks */
const defaultTasksParams: TableParams<TaskSortableColumn> = {
  page: 0,
  pageSize: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/** Delay in milliseconds for loading */
const DELAY_MS = 500;

/**
 * Parse filter arrays from URL search params
 */
function parseFilters(url: string): TaskFilters {
  const searchParams = new URL(url).searchParams;
  return {
    assigneeId: searchParams.getAll('assigneeId'),
    priority: searchParams.getAll('priority') as TaskPriority[],
    status: searchParams.getAll('status') as TaskStatus[],
  };
}

/**
 * Team handlers for /teams endpoints
 */
export const teamHandlers = [
  // GET /api/teams/me - Get current user's team
  http.get('/api/teams/me', ({ cookies }) => {
    const userId = cookies.userId;
    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = testSchema.users.find(userId);
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const team = user.team;
    if (!team) {
      return HttpResponse.json({ error: 'User has no team' }, { status: 404 });
    }

    const json: { team: Team } = team.toJSON();
    return HttpResponse.json(json);
  }),

  // GET /api/teams/me/members - Get current user's team members with pagination and sorting
  http.get('/api/teams/me/members', async ({ cookies, request }) => {
    const userId = cookies.userId;
    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = testSchema.users.find(userId);
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const team = user.team;
    if (!team) {
      return HttpResponse.json({ error: 'User has no team' }, { status: 404 });
    }

    // Parse query params for pagination and sorting
    const { page, pageSize, sortBy, sortOrder } = parseTableQuery(
      request.url,
      defaultMembersParams,
    );

    // Get paginated and sorted team members
    const membersCollection = testSchema.users.findMany({
      where: { teamId: team.id },
      orderBy: { [sortBy]: sortOrder },
      limit: pageSize,
      offset: page * pageSize,
    });
    // Get total count for pagination using collection metadata
    const total = membersCollection.meta?.total ?? 0;

    // Serialize team members without relationships
    const { members } = membersCollection.serialize<{ members: SimpleUser[] }>({
      root: 'members',
      with: [],
    });

    await delay(DELAY_MS);

    return HttpResponse.json({
      members,
      page,
      pageSize,
      sortBy,
      sortOrder,
      total,
    });
  }),

  // GET /api/teams/me/statistics - Task statistics aggregated by date
  http.get('/api/teams/me/statistics', ({ cookies }) => {
    const userId = cookies.userId;
    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = testSchema.users.find(userId);
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const team = user.team;
    if (!team) {
      return HttpResponse.json({ error: 'User has no team' }, { status: 404 });
    }

    const statistics = collectTaskStats(team.tasks);
    return HttpResponse.json({ statistics });
  }),

  // GET /api/teams/me/tasks - Team tasks with pagination, sorting, and filters
  http.get('/api/teams/me/tasks', async ({ cookies, request }) => {
    const userId = cookies.userId;
    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = testSchema.users.find(userId);
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const team = user.team;
    if (!team) {
      return HttpResponse.json({ error: 'User has no team' }, { status: 404 });
    }

    // Parse query params for pagination and sorting
    const { page, pageSize, sortBy, sortOrder } = parseTableQuery(
      request.url,
      defaultTasksParams,
    );

    // Parse filters from query params
    const filters = parseFilters(request.url);
    const { assigneeId, priority, status } = filters;

    // Build where clause dynamically
    const whereClause: Where<ModelAttrs<TaskModel>> = { teamId: team.id };
    if (assigneeId.length > 0) {
      whereClause.assigneeId = { in: assigneeId };
    }
    if (priority.length > 0) {
      whereClause.priority = { in: priority };
    }
    if (status.length > 0) {
      whereClause.status = { in: status };
    }

    // Get paginated, sorted, and filtered tasks
    const tasksCollection = testSchema.tasks.findMany({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      limit: pageSize,
      offset: page * pageSize,
    });

    // Get total count for pagination using collection metadata
    const total = tasksCollection.meta?.total ?? 0;

    // Convert tasks to JSON
    const { tasks } = tasksCollection.toJSON();

    // Serialize simplified team members for the filter dropdown
    const { memberOptions } = team.members.serialize<{ memberOptions: MemberOption[] }>({
      root: 'memberOptions',
      select: ['id', 'name', 'avatar'],
      with: { team: false },
    });

    await delay(DELAY_MS);

    return HttpResponse.json({
      filters,
      memberOptions,
      page,
      pageSize,
      sortBy,
      sortOrder,
      tasks,
      total,
    });
  }),
];
