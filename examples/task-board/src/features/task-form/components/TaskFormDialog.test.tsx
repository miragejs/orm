import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from '@test/context';
import TaskFormDialog from './TaskFormDialog';

describe('TaskFormDialog', () => {
  test('renders "Create Task" title when in create mode', () => {
    render(
      <TaskFormDialog
        isEdit={false}
        onClose={vi.fn()}
        submitLabel="Create"
        submitting={false}
      >
        <div>Form content</div>
      </TaskFormDialog>,
    );

    expect(screen.getByRole('dialog', { name: 'Create Task' })).toBeInTheDocument();
  });

  test('renders "Edit Task" title when in edit mode', () => {
    render(
      <TaskFormDialog
        isEdit={true}
        onClose={vi.fn()}
        submitLabel="Save"
        submitting={false}
      >
        <div>Form content</div>
      </TaskFormDialog>,
    );

    expect(screen.getByRole('dialog', { name: 'Edit Task' })).toBeInTheDocument();
  });

  test('renders children in dialog content', () => {
    render(
      <TaskFormDialog
        isEdit={false}
        onClose={vi.fn()}
        submitLabel="Create"
        submitting={false}
      >
        <div>Form content</div>
      </TaskFormDialog>,
    );

    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  test('renders Cancel and submit button with correct labels when not submitting', () => {
    render(
      <TaskFormDialog
        isEdit={false}
        onClose={vi.fn()}
        submitLabel="Create"
        submitting={false}
      >
        <div>Form</div>
      </TaskFormDialog>,
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  test('calls onClose when Cancel button is clicked', async () => {
    const ui = userEvent.setup();
    const onClose = vi.fn();

    render(
      <TaskFormDialog
        isEdit={false}
        onClose={onClose}
        submitLabel="Create"
        submitting={false}
      >
        <div>Form</div>
      </TaskFormDialog>,
    );

    await ui.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('submit button has form attribute linking to task-form', async () => {
    const ui = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <TaskFormDialog
        isEdit={false}
        onClose={vi.fn()}
        submitLabel="Create"
        submitting={false}
      >
        <form id="task-form" onSubmit={onSubmit} />
      </TaskFormDialog>,
    );

    const submitButton = screen.getByRole('button', { name: 'Create' });
    expect(submitButton).toHaveAttribute('form', 'task-form');

    await ui.click(submitButton);
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
