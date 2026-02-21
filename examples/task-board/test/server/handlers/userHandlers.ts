import { http, HttpResponse } from 'msw';
import { testSchema } from '@test/schema';
import { parseCookieUserId } from '@test/utils';
import type { User } from '@shared/types';

/**
 * User handlers for /users endpoints
 */
export const userHandlers = [
  // GET /api/users/me - Get current user
  http.get('/api/users/me', ({ cookies, request }) => {
    const userId = parseCookieUserId(cookies, request);
    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = testSchema.users.find(userId);
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const json: User = user.toJSON();
    return HttpResponse.json(json);
  }),

  // GET /api/users/:id - Get user by ID
  http.get<{ id: string }>('/api/users/:id', ({ params }) => {
    const user = testSchema.users.find(params.id);
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const json: User = user.toJSON();
    return HttpResponse.json(json);
  }),
];
