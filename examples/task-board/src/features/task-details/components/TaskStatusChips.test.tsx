import { render, screen } from '@testing-library/react';
import { describe, expect, test } from '@test/context';
import { TaskStatus, TaskPriority } from '@shared/enums';
import TaskStatusChips from './TaskStatusChips';

describe('TaskStatusChips', () => {
  test('renders status chip with correct label', () => {
    render(
      <TaskStatusChips status={TaskStatus.IN_PROGRESS} priority={TaskPriority.HIGH} />,
    );

    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  test('renders priority chip', () => {
    render(<TaskStatusChips status={TaskStatus.TODO} priority={TaskPriority.URGENT} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText(TaskPriority.URGENT)).toBeInTheDocument();
  });

  test('renders all status variants', () => {
    const { rerender } = render(
      <TaskStatusChips status={TaskStatus.TODO} priority={TaskPriority.LOW} />,
    );
    expect(screen.getByText('To Do')).toBeInTheDocument();

    rerender(
      <TaskStatusChips status={TaskStatus.IN_PROGRESS} priority={TaskPriority.LOW} />,
    );
    expect(screen.getByText('In Progress')).toBeInTheDocument();

    rerender(<TaskStatusChips status={TaskStatus.REVIEW} priority={TaskPriority.LOW} />);
    expect(screen.getByText('In Review')).toBeInTheDocument();

    rerender(<TaskStatusChips status={TaskStatus.DONE} priority={TaskPriority.LOW} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
