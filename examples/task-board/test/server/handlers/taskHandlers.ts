import { http, HttpResponse, delay } from 'msw';
import { testSchema } from '@test/schema/testSchema';
import { parseCookieUserId } from '@test/server/utils';
import type { Task, Comment, TaskItem, TaskFormValues } from '@shared/types';
import { taskItemSerializer } from '@test/schema/collections/tasks';

/** Delay in milliseconds for loading task comments */
const COMMENTS_DELAY_MS = 500;

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

      const json: TaskItem[] = targetUser.tasks.serialize(taskItemSerializer);
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
        await delay(250);
      }

      const json: Comment = comment.toJSON();
      return HttpResponse.json(json, { status: 201 });
    },
  ),

  // Create task
  http.post('/api/tasks', async ({ cookies, request }) => {
    const currentUserId = parseCookieUserId(cookies, request);
    if (!currentUserId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentUser = testSchema.users.find(currentUserId);
    if (!currentUser) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const teamId = currentUser.teamId;
    if (!teamId) {
      return HttpResponse.json({ error: 'User has no team' }, { status: 400 });
    }

    const values = (await request.json()) as TaskFormValues;
    const task = testSchema.tasks.create({ ...values, teamId });

    const json: Task = task.toJSON();
    return HttpResponse.json(json, { status: 201 });
  }),

  // Update task
  http.patch<{ id: string }>('/api/tasks/:id', async ({ params, cookies, request }) => {
    const currentUserId = parseCookieUserId(cookies, request);
    if (!currentUserId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const task = testSchema.tasks.find(params.id);
    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const values = (await request.json()) as TaskFormValues;
    task.update({ ...values, updatedAt: new Date().toISOString() });

    const json: Task = task.toJSON();
    return HttpResponse.json(json);
  }),

  // Delete task
  http.delete<{ id: string }>('/api/tasks/:id', ({ params, cookies, request }) => {
    const currentUserId = parseCookieUserId(cookies, request);
    if (!currentUserId) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const task = testSchema.tasks.find(params.id);
    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    testSchema.tasks.delete(params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
