import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from '@test/context';
import { renderWithRouter } from '@test/utils';
import { TaskPriority, TaskStatus } from '@shared/enums';
import TasksTableFilters from './TasksTableFilters';
import type { MemberOption, TaskFilters } from '@shared/types';

describe('TasksTableFilters', () => {
  const ui = userEvent.setup();

  const defaultFilters: TaskFilters = {
    assigneeId: [],
    priority: [],
    status: [],
  };

  const defaultMemberOptions: MemberOption[] = [
    { id: 'user-1', name: 'John Doe', avatar: 'https://example.com/avatar1.jpg' },
    { id: 'user-2', name: 'Jane Smith', avatar: 'https://example.com/avatar2.jpg' },
  ];

  test('renders all three filter dropdowns', async () => {
    renderWithRouter(
      <TasksTableFilters filters={defaultFilters} memberOptions={defaultMemberOptions} />,
    );

    expect(screen.getByRole('combobox', { name: 'Assignee' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Priority' })).toBeInTheDocument();
  });

  test('displays member options in assignee dropdown', async () => {
    renderWithRouter(
      <TasksTableFilters filters={defaultFilters} memberOptions={defaultMemberOptions} />,
    );

    const assigneeSelect = screen.getByRole('combobox', { name: 'Assignee' });
    await ui.click(assigneeSelect);

    const listbox = within(screen.getByRole('listbox'));
    expect(listbox.getByRole('option', { name: /John Doe/ })).toBeInTheDocument();
    expect(listbox.getByRole('option', { name: /Jane Smith/ })).toBeInTheDocument();
  });

  test('displays all status options in status dropdown', async () => {
    renderWithRouter(
      <TasksTableFilters filters={defaultFilters} memberOptions={defaultMemberOptions} />,
    );

    const statusSelect = screen.getByRole('combobox', { name: 'Status' });
    await ui.click(statusSelect);

    const listbox = within(screen.getByRole('listbox'));
    expect(listbox.getByRole('option', { name: TaskStatus.TODO })).toBeInTheDocument();
    expect(
      listbox.getByRole('option', { name: TaskStatus.IN_PROGRESS }),
    ).toBeInTheDocument();
    expect(listbox.getByRole('option', { name: TaskStatus.REVIEW })).toBeInTheDocument();
    expect(listbox.getByRole('option', { name: TaskStatus.DONE })).toBeInTheDocument();
  });

  test('displays all priority options in priority dropdown', async () => {
    renderWithRouter(
      <TasksTableFilters filters={defaultFilters} memberOptions={defaultMemberOptions} />,
    );

    const prioritySelect = screen.getByRole('combobox', { name: 'Priority' });
    await ui.click(prioritySelect);

    const listbox = within(screen.getByRole('listbox'));
    expect(listbox.getByRole('option', { name: TaskPriority.LOW })).toBeInTheDocument();
    expect(
      listbox.getByRole('option', { name: TaskPriority.MEDIUM }),
    ).toBeInTheDocument();
    expect(listbox.getByRole('option', { name: TaskPriority.HIGH })).toBeInTheDocument();
    expect(
      listbox.getByRole('option', { name: TaskPriority.URGENT }),
    ).toBeInTheDocument();
  });

  test('shows selected filters as chips', () => {
    const filters: TaskFilters = {
      assigneeId: ['user-1', 'user-2'],
      priority: [TaskPriority.HIGH, TaskPriority.URGENT],
      status: [TaskStatus.IN_PROGRESS, TaskStatus.REVIEW],
    };

    renderWithRouter(
      <TasksTableFilters filters={filters} memberOptions={defaultMemberOptions} />,
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText(TaskPriority.HIGH)).toBeInTheDocument();
    expect(screen.getByText(TaskPriority.URGENT)).toBeInTheDocument();
    expect(screen.getByText(TaskStatus.IN_PROGRESS)).toBeInTheDocument();
    expect(screen.getByText(TaskStatus.REVIEW)).toBeInTheDocument();
  });

  test('shows clear button when assignee filter is applied', () => {
    const filters: TaskFilters = {
      ...defaultFilters,
      assigneeId: ['user-1'],
    };

    renderWithRouter(
      <TasksTableFilters filters={filters} memberOptions={defaultMemberOptions} />,
    );

    expect(screen.getByRole('button', { name: 'Clear filter' })).toBeInTheDocument();
  });

  test('does not show clear button when no assignee filter', () => {
    renderWithRouter(
      <TasksTableFilters filters={defaultFilters} memberOptions={defaultMemberOptions} />,
    );

    expect(
      screen.queryByRole('button', { name: 'Clear filter' }),
    ).not.toBeInTheDocument();
  });

  test('renders member avatars in assignee dropdown', async () => {
    renderWithRouter(
      <TasksTableFilters filters={defaultFilters} memberOptions={defaultMemberOptions} />,
    );

    const assigneeSelect = screen.getByRole('combobox', { name: 'Assignee' });
    await ui.click(assigneeSelect);

    const listbox = screen.getByRole('listbox');
    const avatars = within(listbox).getAllByRole('img', { hidden: true });
    expect(avatars.length).toBeGreaterThanOrEqual(2);
  });

  test('handles empty member options', () => {
    renderWithRouter(<TasksTableFilters filters={defaultFilters} memberOptions={[]} />);

    expect(screen.getByRole('combobox', { name: 'Assignee' })).toBeInTheDocument();
  });
});
