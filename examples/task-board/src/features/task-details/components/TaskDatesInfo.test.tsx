import { render, screen } from '@testing-library/react';
import { describe, expect, test } from '@test/context';
import TaskDatesInfo from './TaskDatesInfo';

describe('TaskDatesInfo', () => {
  test('renders due date and created date', () => {
    const dueDate = '2025-02-15T10:00:00.000Z';
    const createdAt = '2025-01-10T08:30:00.000Z';

    render(<TaskDatesInfo dueDate={dueDate} createdAt={createdAt} />);

    const formattedDueDate = new Date(dueDate).toLocaleDateString();
    const formattedCreatedAt = new Date(createdAt).toLocaleDateString();

    expect(screen.getByText(`Due:`)).toBeInTheDocument();
    expect(screen.getByText(formattedDueDate, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(`Created:`)).toBeInTheDocument();
    expect(screen.getByText(formattedCreatedAt, { exact: false })).toBeInTheDocument();
  });
});
