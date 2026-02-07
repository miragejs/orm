import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, describe, expect } from '@test/context';
import { taskItemSerializer } from '@test/schema/collections/tasks';
import TaskCard from './TaskCard';

describe('TaskCard', () => {
  const ui = userEvent.setup();

  test('renders task title, status, and priority', ({ schema }) => {
    const task = schema.tasks.create().serialize(taskItemSerializer);
    const onTaskClick = vi.fn();

    render(<TaskCard task={task} statusColor="info" onTaskClick={onTaskClick} />);

    expect(screen.getByText(task.title)).toBeInTheDocument();
    expect(screen.getByText(task.status)).toBeInTheDocument();
    expect(screen.getByText(task.priority)).toBeInTheDocument();
  });

  test('renders due date', ({ schema }) => {
    const task = schema.tasks.create().serialize(taskItemSerializer);
    const onTaskClick = vi.fn();

    render(<TaskCard task={task} statusColor="info" onTaskClick={onTaskClick} />);

    const formattedDate = new Date(task.dueDate).toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  test('calls onTaskClick when clicked', async ({ schema }) => {
    const task = schema.tasks.create().serialize(taskItemSerializer);
    const onTaskClick = vi.fn();

    render(<TaskCard task={task} statusColor="info" onTaskClick={onTaskClick} />);

    await ui.click(screen.getByText(task.title));

    expect(onTaskClick).toHaveBeenCalledWith(task.id);
  });
});
