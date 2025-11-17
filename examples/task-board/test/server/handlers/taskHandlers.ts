import { http, HttpResponse } from 'msw';
import { devSchema } from '@test/schema/devSchema';
import { Task } from '@shared/types';

export const taskHandlers = [
  // Get all tasks for the current user
  http.get('/api/tasks', ({ cookies }) => {
    const userId = cookies.userId;

    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch tasks assigned to the current user
    const user = devSchema.users.find(userId);
    const json: { tasks: Task[] } | undefined = user?.tasks.toJSON();

    return HttpResponse.json(json);
  }),
];
