import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { taskHandlers } from '@test/server/handlers';
import { clearUserCookie, setUserCookie } from '@test/utils';
import { TaskStatus, TaskPriority } from '@shared/enums';
import { createTask } from './createTask';

const server = setupServer(...taskHandlers);

describe('createTask', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('creates task', async ({ schema }) => {
    const user = schema.users.create();
    setUserCookie(user.id);

    const payload = {
      assigneeId: user.id,
      description: 'Test description',
      dueDate: new Date().toISOString(),
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      title: 'New task',
    };

    const result = await createTask(payload);
    const created = schema.tasks.find(result.id)!;
    const task = created.toJSON();

    expect(result).toMatchObject({
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      status: payload.status,
    });
    expect(result).toMatchObject(task);
  });

  test('throws api error', async () => {
    const payload = {
      assigneeId: null,
      dueDate: new Date().toISOString(),
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      title: 'Task',
    };

    await expect(createTask(payload)).rejects.toThrow();
  });
});
