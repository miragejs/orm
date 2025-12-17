import { http, HttpResponse, delay } from 'msw';
import { testSchema } from '@test/schema/testSchema';
import { Task, Comment, DetailedTask } from '@shared/types';

/** Delay in milliseconds for loading task comments */
const COMMENTS_DELAY_MS = 1500;

export const taskHandlers = [
  // Get all tasks for the current user
  http.get('/api/tasks', ({ cookies }) => {
    const userId = cookies.userId;

    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch tasks assigned to the current user
    const user = testSchema.users.find(userId)!;
    const json: { tasks: Task[] } = user.tasks.toJSON();

    return HttpResponse.json(json);
  }),

  // Get task details by ID
  http.get<{ id: string }>('/api/tasks/:id', ({ params, cookies }) => {
    const userId = cookies.userId;

    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const task = testSchema.tasks.find(params.id);

    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user has access to this task
    if (task.assigneeId !== userId) {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json: { task: DetailedTask } = task.serialize<{
      task: DetailedTask;
    }>({ relationsMode: 'embedded' });

    return HttpResponse.json(json);
  }),

  // Get comments for a specific task
  http.get<{ id: string }>('/api/tasks/:id/comments', async ({ params, cookies }) => {
    const userId = cookies.userId;

    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const task = testSchema.tasks.find(params.id);

    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user has access to this task's comments
    if (task.assigneeId !== userId) {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json: { comments: Comment[] } = task.comments.toJSON();

    // Simulate network delay for deferred loading demonstration
    await delay(COMMENTS_DELAY_MS);

    return HttpResponse.json(json);
  }),
];
