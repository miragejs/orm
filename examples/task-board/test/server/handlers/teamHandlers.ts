import { delay, http, HttpResponse } from 'msw';
import { testSchema } from '@test/schema/testSchema';
import { Team, TeamMember, User } from '@shared/types';
import { parseTableQuery } from '@shared/utils';
import { defaultMembersParams } from '@features/team/api';

/** Delay in milliseconds for loading team members */
const MEMBERS_DELAY_MS = 1000;

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

  // GET /api/teams/me/manager - Get current user's team manager
  http.get('/api/teams/me/manager', ({ cookies }) => {
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

    const manager = team.manager;
    if (!manager) {
      return HttpResponse.json({ manager: null });
    }

    const json = manager.serialize<{ manager: User }>({ root: 'manager' });
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

    // Get total count for pagination
    const total = team.members.length;

    // Use DbCollection query capabilities for sorting and pagination
    const membersCollection = testSchema.users.findMany({
      where: { teamId: team.id },
      orderBy: { [sortBy]: sortOrder },
      limit: pageSize,
      offset: page * pageSize,
    });

    // Serialize using ORM's serialize method
    const { members } = membersCollection.serialize<{ members: TeamMember[] }>({
      root: 'members',
      with: { team: { mode: 'foreignKey' } },
    });

    await delay(MEMBERS_DELAY_MS);

    return HttpResponse.json({ members, total, page, pageSize, sortBy, sortOrder });
  }),
];
