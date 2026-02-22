import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from '@test/context';
import { renderWithRouter } from '@test/utils';
import { userInfoSerializer } from '@test/schema/collections/users';
import { TaskStatus, TaskPriority } from '@shared/enums';
import TaskFormFields from './TaskFormFields';

describe('TaskFormFields', () => {
  test('renders form with correct id attribute', ({ schema }) => {
    const team = schema.teams.create('withManager');
    const members = team.members.serialize(userInfoSerializer);

    renderWithRouter(
      <TaskFormFields
        defaultAssigneeId={undefined}
        members={members}
        redirectTo="/team/dashboard"
        task={null}
        taskId="new"
      />,
    );

    const form = screen.getByRole('form', { name: 'Task form' });
    expect(form).toHaveAttribute('id', 'task-form');
  });

  test('renders all fields in create mode', ({ schema }) => {
    const team = schema.teams.create('withManager');
    const members = team.members.serialize(userInfoSerializer);

    renderWithRouter(
      <TaskFormFields
        defaultAssigneeId={undefined}
        members={members}
        redirectTo="/team/dashboard"
        task={null}
        taskId="new"
      />,
    );

    expect(screen.getByRole('textbox', { name: /Title/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Priority' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Due date/)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Assignee' })).toBeInTheDocument();
  });

  test('shows default values in create mode', ({ schema }) => {
    const team = schema.teams.create('withManager');
    const members = team.members.serialize(userInfoSerializer);

    renderWithRouter(
      <TaskFormFields
        defaultAssigneeId={undefined}
        members={members}
        redirectTo="/team/dashboard"
        task={null}
        taskId="new"
      />,
    );

    expect(screen.getByLabelText(/Title/)).toHaveValue('');
    expect(screen.getByLabelText('Description')).toHaveValue('');
    expect(screen.getByLabelText('Status')).toHaveTextContent(TaskStatus.TODO);
    expect(screen.getByLabelText('Priority')).toHaveTextContent(TaskPriority.MEDIUM);
  });

  test('shows task values in edit mode', ({ schema }) => {
    const manager = schema.users.create('manager');
    const task = schema.tasks
      .create('inProgress', 'highPriority', {
        creator: manager,
        title: 'Edit me',
        description: 'Task description',
      })
      .toJSON();
    const members = manager.team.members.serialize(userInfoSerializer);

    renderWithRouter(
      <TaskFormFields
        defaultAssigneeId={undefined}
        members={members}
        redirectTo="/team/dashboard"
        task={task}
        taskId={task.id}
      />,
    );

    expect(screen.getByLabelText(/Title/)).toHaveValue('Edit me');
    expect(screen.getByLabelText('Description')).toHaveValue('Task description');
    expect(screen.getByLabelText('Status')).toHaveTextContent(task.status);
    expect(screen.getByLabelText('Priority')).toHaveTextContent(task.priority);
  });

  test('updates form values when user types', async ({ schema }) => {
    const ui = userEvent.setup();
    const team = schema.teams.create('withManager');
    const members = team.members.serialize(userInfoSerializer);

    renderWithRouter(
      <TaskFormFields
        defaultAssigneeId={undefined}
        members={members}
        redirectTo="/team/dashboard"
        task={null}
        taskId="new"
      />,
    );

    const titleInput = screen.getByLabelText(/Title/);
    await ui.type(titleInput, 'New task title');

    expect(titleInput).toHaveValue('New task title');
  });

  test('renders assignee field when members provided', async ({ schema }) => {
    const ui = userEvent.setup();
    const team = schema.teams.create('withManager');
    const members = team.members.serialize(userInfoSerializer);
    const { manager } = team;

    renderWithRouter(
      <TaskFormFields
        defaultAssigneeId={undefined}
        members={members}
        redirectTo="/team/dashboard"
        task={null}
        taskId="new"
      />,
    );

    const assigneeSelect = screen.getByRole('combobox', { name: 'Assignee' });
    expect(assigneeSelect).toBeInTheDocument();

    await ui.click(assigneeSelect);

    expect(screen.getByRole('option', { name: manager.name })).toBeInTheDocument();
  });
});
