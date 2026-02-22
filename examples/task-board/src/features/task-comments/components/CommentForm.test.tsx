import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from '@test/context';
import { renderWithRouter } from '@test/utils';
import { CommentForm } from './CommentForm';

describe('CommentForm', () => {
  test('renders text field with label', () => {
    renderWithRouter(<CommentForm taskId="task-1" />);

    expect(screen.getByLabelText('Add a comment')).toBeInTheDocument();
  });

  test('renders send and cancel buttons', () => {
    renderWithRouter(<CommentForm taskId="task-1" />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('buttons are disabled when text field is empty', () => {
    renderWithRouter(<CommentForm taskId="task-1" />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  test('buttons are enabled when text is entered', async () => {
    const ui = userEvent.setup();

    renderWithRouter(<CommentForm taskId="task-1" />);

    const textField = screen.getByLabelText('Add a comment');
    await ui.type(textField, 'Test comment');

    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });

  test('cancel button clears the text field', async () => {
    const ui = userEvent.setup();

    renderWithRouter(<CommentForm taskId="task-1" />);

    const textField = screen.getByLabelText('Add a comment');
    await ui.type(textField, 'Test comment');

    expect(textField).toHaveValue('Test comment');

    await ui.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(textField).toHaveValue('');
  });

  test('includes hidden taskId input', () => {
    renderWithRouter(<CommentForm taskId="task-123" />);

    const hiddenInput = document.querySelector('input[name="taskId"]');
    expect(hiddenInput).toHaveValue('task-123');
  });

  test('buttons remain disabled with only whitespace', async () => {
    const ui = userEvent.setup();

    renderWithRouter(<CommentForm taskId="task-1" />);

    const textField = screen.getByLabelText('Add a comment');
    await ui.type(textField, '   ');

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
