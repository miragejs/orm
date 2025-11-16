import { http, HttpResponse } from 'msw';
import { devSchema } from '@test/schema/devSchema';

/**
 * User handlers for /users endpoints
 */
export const userHandlers = [
  // GET /api/users/me - Get current user
  http.get('/api/users/me', ({ cookies }) => {
    const userId = cookies.userId;

    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = devSchema.users.find(userId);

    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return HttpResponse.json(user.toJSON());
  }),

  // GET /api/users/:id - Get user by ID
  http.get<{ id: string }>('/api/users/:id', ({ params }) => {
    const user = devSchema.users.find(params.id);

    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return HttpResponse.json(user.toJSON());
  }),
];
