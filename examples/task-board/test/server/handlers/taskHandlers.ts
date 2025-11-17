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

  // Get task details by ID
  http.get<{ id: string }>('/api/tasks/:id', ({ params, cookies }) => {
    const userId = cookies.userId;

    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const task = devSchema.tasks.find(params.id);

    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user has access to this task
    if (task.assigneeId !== userId) {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return HttpResponse.json(task.toJSON());
  }),
];
