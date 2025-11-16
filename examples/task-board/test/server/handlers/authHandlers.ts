import { http, HttpResponse, PathParams } from 'msw';
import { devSchema } from '@test/schema/devSchema';

/**
 * Auth handlers for login and logout endpoints
 */
export const authHandlers = [
  // POST /api/auth/login - User login
  http.post<PathParams, { email: string }>('/api/auth/login', async ({ request }) => {
    const { email } = await request.json();

    // Find user by email
    const user = devSchema.users.find({ email });

    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Store user ID in session cookie
    return HttpResponse.json(user.toJSON(), {
      status: 200,
      headers: {
        'Set-Cookie': `userId=${user.id}; Path=/; HttpOnly; SameSite=Strict`,
      },
    });
  }),

  // POST /api/auth/logout - User logout
  http.post('/api/auth/logout', () => {
    return HttpResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Set-Cookie': 'userId=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
        },
      },
    );
  }),
];
