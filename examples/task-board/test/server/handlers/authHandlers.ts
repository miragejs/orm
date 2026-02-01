import { http, HttpResponse, PathParams } from 'msw';
import { testSchema } from '@test/schema/testSchema';
import type { User } from '@shared/types';

/**
 * Auth handlers for login and logout endpoints
 */
export const authHandlers = [
  // POST /api/auth/login - User login
  http.post<PathParams, { email: string }>('/api/auth/login', async ({ request }) => {
    const { email } = await request.json();

    // Find user by email
    const user = testSchema.users.find({ email });
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Store user ID in session cookie
    const json: User = user.toJSON();
    return HttpResponse.json(json, {
      status: 200,
      headers: { 'Set-Cookie': `userId=${user.id}; Path=/; HttpOnly` },
    });
  }),

  // POST /api/auth/logout - User logout
  http.post('/api/auth/logout', () => {
    return HttpResponse.json(
      { success: true },
      {
        status: 200,
        headers: { 'Set-Cookie': 'userId=; Path=/; Max-Age=0' },
      },
    );
  }),
];
