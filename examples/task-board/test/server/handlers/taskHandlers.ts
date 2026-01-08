import { http, HttpResponse, delay } from 'msw';
import { testSchema } from '@test/schema/testSchema';
import { Task, Comment, SimpleTask } from '@shared/types';

/** Delay in milliseconds for loading task comments */
const COMMENTS_DELAY_MS = 1500;

export const taskHandlers = [
  // Get all tasks for a specific user
  http.get<{ userId: string }>('/api/users/:userId/tasks', ({ params, cookies }) => {
    const currentUserId = cookies.userId;
    if (!currentUserId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const targetUser = testSchema.users.find(params.userId);
    if (!targetUser) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const json = targetUser.tasks.serialize<{ tasks: SimpleTask[] }>({
      select: ['id', 'title', 'status', 'priority', 'dueDate'],
      with: [],
    });
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

    const json: { task: Task } = task.toJSON();
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

    const json: { comments: Comment[] } = task.comments.toJSON();

    // Simulate network delay for deferred loading demonstration
    await delay(COMMENTS_DELAY_MS);

    return HttpResponse.json(json);
  }),
];
