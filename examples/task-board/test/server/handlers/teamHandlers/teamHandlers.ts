import { delay, http, HttpResponse } from 'msw';
import { testSchema } from '@test/schema';
import {
  memberOptionSerializer,
  userInfoSerializer,
} from '@test/schema/collections/users';
import { parseTableQuery } from '@shared/utils';
import { ModelAttrs, Where } from 'miragejs-orm';
import { TaskModel } from '@test/schema/models';
import { parseCookieUserId } from '@test/utils';
import { collectTaskStats } from './collectTaskStats';
import { defaultMembersParams, defaultTasksParams, parseFilters } from './parseFilters';
import type { MemberOption, Team, UserInfo } from '@shared/types';

/**
 * Team handlers for /teams endpoints
 */
export const teamHandlers = [
  // GET /api/teams/me - Get current user's team
  http.get('/api/teams/me', ({ cookies, request }) => {
    const userId = parseCookieUserId(cookies, request);
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

    const json: Team = team.toJSON();
    return HttpResponse.json(json);
  }),

  // GET /api/teams/me/members - Get current user's team members with pagination and sorting
  http.get('/api/teams/me/members', async ({ cookies, request }) => {
    const userId = parseCookieUserId(cookies, request);
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
    const members: UserInfo[] = membersCollection.serialize(userInfoSerializer);

    // Simulate network delay for deferred loading demonstration in development
    if (process.env.NODE_ENV === 'development') {
      await delay(250);
    }

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
  http.get('/api/teams/me/statistics', ({ cookies, request }) => {
    const userId = parseCookieUserId(cookies, request);
    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = testSchema.users.find(userId);
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const team = testSchema.teams.find(user.teamId);
    if (!team) {
      return HttpResponse.json({ error: 'User has no team' }, { status: 404 });
    }

    const statistics = collectTaskStats(team.tasks);
    return HttpResponse.json({ statistics });
  }),

  // GET /api/teams/me/tasks - Team tasks with pagination, sorting, and filters
  http.get('/api/teams/me/tasks', async ({ cookies, request }) => {
    const userId = parseCookieUserId(cookies, request);
    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = testSchema.users.find(userId);
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const team = testSchema.teams.find(user.teamId);
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
    const tasks = tasksCollection.toJSON();

    // Serialize simplified team members for the filter dropdown
    const memberOptions: MemberOption[] = team.members.serialize(memberOptionSerializer);

    // Simulate network delay for deferred loading demonstration in development
    if (process.env.NODE_ENV === 'development') {
      await delay(250);
    }

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
