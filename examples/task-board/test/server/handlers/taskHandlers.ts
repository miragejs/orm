import { http, HttpResponse, delay } from 'msw';
import { testSchema } from '@test/schema/testSchema';
import { parseCookieUserId } from '@test/server/utils';
import type { Task, Comment, TaskListItem } from '@shared/types';

/** Delay in milliseconds for loading task comments */
const COMMENTS_DELAY_MS = 1500;

export const taskHandlers = [
  // Get all tasks for a specific user
  http.get<{ userId: string }>(
    '/api/users/:userId/tasks',
    ({ params, cookies, request }) => {
      const currentUserId = parseCookieUserId(cookies, request);
      if (!currentUserId) {
        return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const targetUser = testSchema.users.find(params.userId);
      if (!targetUser) {
        return HttpResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const json = targetUser.tasks.serialize<TaskListItem[]>({
        select: ['id', 'title', 'status', 'priority', 'dueDate'],
        with: [],
      });
      return HttpResponse.json(json);
    },
  ),

  // Get task details by ID
  http.get<{ id: string }>('/api/tasks/:id', ({ params, cookies, request }) => {
    const userId = parseCookieUserId(cookies, request);
    if (!userId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const task = testSchema.tasks.find(params.id);
    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const json: Task = task.toJSON();
    return HttpResponse.json(json);
  }),

  // Get comments for a specific task
  http.get<{ id: string }>(
    '/api/tasks/:id/comments',
    async ({ params, cookies, request }) => {
      const userId = parseCookieUserId(cookies, request);
      if (!userId) {
        return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const task = testSchema.tasks.find(params.id);
      if (!task) {
        return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const json: Comment[] = testSchema.comments
        .findMany({
          where: { taskId: task.id },
          orderBy: { createdAt: 'desc' },
        })
        .toJSON();

      // Simulate network delay for deferred loading demonstration in development
      if (process.env.NODE_ENV === 'development') {
        await delay(COMMENTS_DELAY_MS);
      }

      return HttpResponse.json(json);
    },
  ),

  // Add a comment to a specific task
  http.post<{ id: string }>(
    '/api/tasks/:id/comments',
    async ({ params, cookies, request }) => {
      const userId = parseCookieUserId(cookies, request);
      if (!userId) {
        return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const task = testSchema.tasks.find(params.id);
      if (!task) {
        return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const author = testSchema.users.find(userId);
      if (!author) {
        return HttpResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const body = (await request.json()) as { content: string };
      const content = body.content.trim();
      const comment = testSchema.comments.create({
        author,
        content: content,
        createdAt: new Date().toISOString(),
        task,
      });

      // Simulate network delay for deferred loading demonstration in development
      if (process.env.NODE_ENV === 'development') {
        await delay(500);
      }

      const json: Comment = comment.toJSON();
      return HttpResponse.json(json, { status: 201 });
    },
  ),
];
