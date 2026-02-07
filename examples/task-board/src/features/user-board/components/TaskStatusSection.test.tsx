import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, describe, expect } from '@test/context';
import { taskItemSerializer } from '@test/schema/collections/tasks';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { TaskStatus } from '@shared/enums';
import TaskStatusSection from './TaskStatusSection';

describe('TaskStatusSection', () => {
  const ui = userEvent.setup();

  const defaultProps = {
    status: TaskStatus.IN_PROGRESS,
    statusLabel: 'In Progress',
    statusIcon: ScheduleIcon,
    statusColor: 'info' as const,
    expanded: false,
    onExpandChange: vi.fn(),
    onTaskClick: vi.fn(),
  };

  test('renders status label and task count', ({ schema }) => {
    const tasks = schema.tasks.createMany(3).serialize(taskItemSerializer);

    render(<TaskStatusSection {...defaultProps} tasks={tasks} />);

    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('shows "No tasks" message when empty and expanded', () => {
    render(<TaskStatusSection {...defaultProps} tasks={[]} expanded={true} />);

    expect(screen.getByText('No tasks in this status')).toBeInTheDocument();
  });

  test('renders task cards when expanded', ({ schema }) => {
    const tasks = schema.tasks.createMany(2).serialize(taskItemSerializer);

    render(<TaskStatusSection {...defaultProps} tasks={tasks} expanded={true} />);

    expect(screen.getByText(tasks[0].title)).toBeInTheDocument();
    expect(screen.getByText(tasks[1].title)).toBeInTheDocument();
  });

  test('calls onExpandChange when accordion is clicked', async () => {
    const onExpandChange = vi.fn();

    render(
      <TaskStatusSection {...defaultProps} tasks={[]} onExpandChange={onExpandChange} />,
    );

    await ui.click(screen.getByText('In Progress'));

    expect(onExpandChange).toHaveBeenCalledWith(true);
  });

  test('calls onTaskClick when task card is clicked', async ({ schema }) => {
    const tasks = schema.tasks.createMany(1).serialize(taskItemSerializer);
    const onTaskClick = vi.fn();

    render(
      <TaskStatusSection
        {...defaultProps}
        tasks={tasks}
        expanded={true}
        onTaskClick={onTaskClick}
      />,
    );

    await ui.click(screen.getByText(tasks[0].title));

    expect(onTaskClick).toHaveBeenCalledWith(tasks[0].id);
  });
});
