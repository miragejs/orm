import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { describe, expect, test, beforeAll, afterAll, afterEach } from '@test/context';
import { handlers } from '@test/server/handlers';
import { clearUserCookie, renderApp, setUserCookie } from '@test/utils';

const server = setupServer(...handlers);

describe('TaskForm', () => {
  const ui = userEvent.setup();

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('creates a task and redirects to task details', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    const taskTitle = 'Test task';
    setUserCookie(manager.id);

    renderApp(`/${team.slug}/dashboard/tasks/new`);

    const createTaskDialog = within(
      await screen.findByRole('dialog', { name: 'Create Task' }),
    );

    const titleInput = createTaskDialog.getByLabelText(/Title/);
    await ui.type(titleInput, taskTitle);

    const descriptionInput = createTaskDialog.getByLabelText('Description');
    await ui.type(descriptionInput, 'Test description');

    const statusInput = createTaskDialog.getByLabelText('Status');
    await ui.click(statusInput);
    await ui.click(screen.getByRole('option', { name: 'IN_PROGRESS' }));

    const priorityInput = createTaskDialog.getByLabelText('Priority');
    await ui.click(priorityInput);
    await ui.click(screen.getByRole('option', { name: 'HIGH' }));

    await ui.click(createTaskDialog.getByRole('button', { name: 'Create' }));

    const taskDetailsDialog = within(
      await screen.findByRole('dialog', { name: new RegExp(taskTitle) }),
    );
    expect(taskDetailsDialog.getByText('Test description')).toBeInTheDocument();
    expect(taskDetailsDialog.getByText('In Progress')).toBeInTheDocument();
    expect(taskDetailsDialog.getByText('HIGH')).toBeInTheDocument();
  });

  test('edits a task and redirects to task details with updated task data', async ({
    schema,
  }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    const task = schema.tasks.create('inProgress', {
      creator: manager,
      title: 'Original title',
    });
    setUserCookie(manager.id);

    renderApp(`/${team.slug}/dashboard/tasks/${task.id}`);

    const editTaskDialog = within(
      await screen.findByRole('dialog', { name: 'Edit Task' }),
    );

    const titleInput = editTaskDialog.getByLabelText(/Title/);
    expect(titleInput).toHaveValue('Original title');

    await ui.clear(titleInput);
    await ui.type(titleInput, 'Updated title');

    const statusSelect = editTaskDialog.getByLabelText('Status');
    await ui.click(statusSelect);
    await ui.click(screen.getByRole('option', { name: 'DONE' }));

    await ui.click(editTaskDialog.getByRole('button', { name: 'Save' }));

    const taskDetailsDialog = within(
      await screen.findByRole('dialog', { name: /Updated title/ }),
    );
    expect(taskDetailsDialog.getByText('Completed')).toBeInTheDocument();
  });

  test('shows create form with default values when opening new task', async ({
    schema,
  }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    setUserCookie(manager.id);

    renderApp(`/${team.slug}/dashboard/tasks/new`);

    const dialog = within(await screen.findByRole('dialog', { name: 'Create Task' }));

    expect(dialog.getByLabelText(/Title/)).toHaveValue('');
    expect(dialog.getByLabelText('Description')).toHaveValue('');
    expect(dialog.getByLabelText('Status')).toHaveTextContent('TODO');
    expect(dialog.getByLabelText('Priority')).toHaveTextContent('MEDIUM');

    const dueDateInput = dialog.getByLabelText(/Due date/) as HTMLInputElement;
    expect(dueDateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(dialog.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('shows edit form with task data when opening existing task', async ({
    schema,
  }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    const task = schema.tasks.create('review', 'highPriority', 'withAssignee', {
      creator: manager,
      title: 'Task to edit',
      description: 'Task description',
      dueDate: '2026-03-15T12:00:00.000Z',
    });
    const { assignee } = task;
    setUserCookie(manager.id);

    renderApp(`/${team.slug}/dashboard/tasks/${task.id}`);

    const dialog = within(await screen.findByRole('dialog', { name: 'Edit Task' }));

    expect(dialog.getByLabelText(/Title/)).toHaveValue('Task to edit');
    expect(dialog.getByLabelText('Description')).toHaveValue('Task description');
    expect(dialog.getByLabelText('Status')).toHaveTextContent('REVIEW');
    expect(dialog.getByLabelText('Priority')).toHaveTextContent('HIGH');
    expect(dialog.getByLabelText('Assignee')).toHaveTextContent(assignee.name);

    const dueDateInput = dialog.getByLabelText(/Due date/) as HTMLInputElement;
    expect(dueDateInput.value).toBe('2026-03-15');

    expect(dialog.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});
