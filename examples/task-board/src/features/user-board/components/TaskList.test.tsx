import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, describe, expect } from '@test/context';
import { taskItemSerializer } from '@test/schema/collections/tasks';
import TaskList from './TaskList';

describe('TaskList', () => {
  const ui = userEvent.setup();

  test('renders "My Tasks" heading', ({ schema }) => {
    const tasks = schema.tasks.createMany(1).serialize(taskItemSerializer);

    render(<TaskList tasks={tasks} onTaskClick={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'My Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'My Tasks' })).toBeInTheDocument();
  });

  test('renders all status sections', ({ schema }) => {
    const tasks = schema.tasks.createMany(1).serialize(taskItemSerializer);

    render(<TaskList tasks={tasks} onTaskClick={vi.fn()} />);

    const statuses = ['In Progress', 'To Do', 'In Review', 'Completed'];
    for (const status of statuses) {
      expect(screen.getByRole('heading', { name: status })).toBeInTheDocument();
    }
  });

  test('groups tasks by status', ({ schema }) => {
    schema.tasks.create('inProgress');
    schema.tasks.create('todo');

    const tasks = schema.tasks.all().serialize(taskItemSerializer);

    render(<TaskList tasks={tasks} onTaskClick={vi.fn()} />);

    // In Progress section shows count of 1
    const inProgressSection = screen
      .getByRole('heading', { name: 'In Progress' })
      .closest('div');
    expect(inProgressSection).toHaveTextContent('1');

    // To Do section shows count of 1
    const todoSection = screen.getByRole('heading', { name: 'To Do' }).closest('div');
    expect(todoSection).toHaveTextContent('1');
  });

  test('expands In Progress section by default', ({ schema }) => {
    schema.tasks.create('inProgress');
    schema.tasks.create('todo');

    const tasks = schema.tasks.all().serialize(taskItemSerializer);
    const [inProgressTask, todoTask] = tasks;

    render(<TaskList tasks={tasks} onTaskClick={vi.fn()} />);

    // Task should be visible since In Progress is expanded by default
    expect(screen.getByText(inProgressTask.title)).toBeVisible();
    expect(screen.getByText(todoTask.title)).not.toBeVisible();
  });

  test('collapses section when clicking expanded section header', async ({ schema }) => {
    const task = schema.tasks.create('inProgress').serialize(taskItemSerializer);

    render(<TaskList tasks={[task]} onTaskClick={vi.fn()} />);

    // Section expanded initially
    const expandButton = screen.getByRole('button', { name: /In Progress/i });
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');

    // Click to collapse
    await ui.click(expandButton);

    // Section should be collapsed
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('expands different section when clicked', async ({ schema }) => {
    const todoTask = schema.tasks.create('todo').serialize(taskItemSerializer);

    render(<TaskList tasks={[todoTask]} onTaskClick={vi.fn()} />);

    // To Do section collapsed initially
    const todoButton = screen.getByRole('button', { name: /To Do/i });
    expect(todoButton).toHaveAttribute('aria-expanded', 'false');

    // Click To Do section to expand
    await ui.click(todoButton);

    // Section should be expanded
    expect(todoButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(todoTask.title)).toBeVisible();
  });

  test('calls onTaskClick when task is clicked', async ({ schema }) => {
    const task = schema.tasks.create('inProgress').serialize(taskItemSerializer);
    const onTaskClick = vi.fn();

    render(<TaskList tasks={[task]} onTaskClick={onTaskClick} />);

    await ui.click(screen.getByText(task.title));

    expect(onTaskClick).toHaveBeenCalledWith(task.id);
  });

  test('shows empty state for sections with no tasks', () => {
    render(<TaskList tasks={[]} onTaskClick={vi.fn()} />);

    // All sections show empty message (4 status sections)
    expect(screen.getAllByText('No tasks in this status')).toHaveLength(4);
  });
});
