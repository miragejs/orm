import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from '@test/context';
import { formatTaskTitle } from '@shared/utils';
import TaskDetailsDialog from './TaskDetailsDialog';

describe('TaskDetailsDialog', () => {
  const ui = userEvent.setup();

  test('renders dialog with task title', ({ schema }) => {
    const task = schema.tasks.create().toJSON();
    const onClose = vi.fn();

    render(<TaskDetailsDialog task={task} onClose={onClose} />);

    expect(
      screen.getByRole('dialog', { name: formatTaskTitle(task) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: formatTaskTitle(task), level: 2 }),
    ).toBeInTheDocument();
  });

  test('renders task description', ({ schema }) => {
    const task = schema.tasks.create().toJSON();
    const onClose = vi.fn();

    render(<TaskDetailsDialog task={task} onClose={onClose} />);

    expect(screen.getByText(task.description)).toBeInTheDocument();
  });

  test('renders status and priority chips', ({ schema }) => {
    const task = schema.tasks.create('inProgress', 'highPriority').toJSON();
    const onClose = vi.fn();

    render(<TaskDetailsDialog task={task} onClose={onClose} />);

    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  test('renders assignee and creator info', ({ schema }) => {
    const task = schema.tasks.create('withAssignee');
    const { creator, assignee } = task;
    const onClose = vi.fn();

    render(<TaskDetailsDialog task={task.toJSON()} onClose={onClose} />);

    expect(screen.getByText(creator.name)).toBeInTheDocument();
    expect(screen.getByText(assignee.name)).toBeInTheDocument();
  });

  test('renders team card with team info', ({ schema }) => {
    const task = schema.tasks.create();
    const { team } = task;
    const onClose = vi.fn();

    render(<TaskDetailsDialog task={task.toJSON()} onClose={onClose} />);

    expect(screen.getByText(team.name)).toBeInTheDocument();
    expect(screen.getByText(team.department)).toBeInTheDocument();
  });

  test('renders due date and created date', ({ schema }) => {
    const task = schema.tasks.create().toJSON();
    const onClose = vi.fn();

    render(<TaskDetailsDialog task={task} onClose={onClose} />);

    expect(
      screen.getByText(new Date(task.dueDate).toLocaleDateString()),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new Date(task.createdAt).toLocaleDateString()),
    ).toBeInTheDocument();
  });

  test('renders children content', ({ schema }) => {
    const task = schema.tasks.create().toJSON();
    const onClose = vi.fn();

    render(
      <TaskDetailsDialog task={task} onClose={onClose}>
        <div data-testid="comments-section">Comments here</div>
      </TaskDetailsDialog>,
    );

    expect(screen.getByTestId('comments-section')).toHaveTextContent('Comments here');
  });

  test('calls onClose when close button is clicked', async ({ schema }) => {
    const task = schema.tasks.create().toJSON();
    const onClose = vi.fn();

    render(<TaskDetailsDialog task={task} onClose={onClose} />);

    await ui.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  test('calls onClose when dialog backdrop is clicked', async ({ schema }) => {
    const task = schema.tasks.create().toJSON();
    const onClose = vi.fn();

    render(<TaskDetailsDialog task={task} onClose={onClose} />);

    // Click the backdrop (dialog root)
    const dialog = screen.getByRole('dialog');
    await ui.click(dialog.parentElement!);

    expect(onClose).toHaveBeenCalled();
  });
});
